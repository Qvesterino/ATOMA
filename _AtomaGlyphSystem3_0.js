/**
 * ATOMA GLYPH SYSTEM 3.0
 * 
 * Unified visual glyph framework for mythic, personality, evolution, and world-event markers.
 * Safe, non-destructive visual overlay system with zero gameplay impact.
 * 
 * STRICT SAFETY RULES:
 * - No modification to node lifecycle or physics
 * - No replacing materials on nodes
 * - All glyphs are independent child objects (added + removed cleanly)
 * - Zero impact when missing (fail-safe)
 * - < 1ms per frame update total
 * - No volumetrics, no particle storms, no shaders replaced
 * 
 * GLYPH TYPES:
 * 1. AI Consciousness Glyph (Fractal Hexagon)
 * 2. Mythic Seed Glyph (Fractal Triangle Spiral)
 * 3. Ascended Node Glyph (Orbital Halo Ring)
 * 4. Evolution Stage Glyphs (1/2/3)
 * 5. Personality State Glyphs (Harmony/Instability/Corruption/Synergy)
 * 6. Event Glyphs (Ritual/Surge/WorldEvent)
 */

import * as THREE from 'three';

export class AtomaGlyphSystem3_0 {
  constructor(scene) {
    this.scene = scene;
    
    // Master glyph container (for easy reset)
    this.glyphContainer = new THREE.Group();
    this.glyphContainer.userData.isAtomaGlyphContainer = true;
    this.glyphContainer.name = 'AtomaGlyphSystem';
    this.scene.add(this.glyphContainer);
    
    // Registry: nodeId → { node, glyphGroup, glyphType, metadata }
    this.glyphRegistry = new Map();
    
    // Glyph-to-node mapping (reverse lookup)
    this.nodeToGlyph = new Map();
    
    // Fade-out animations in progress
    this.fadingOut = new Set();
    
    // Glyph assignment tracking (nodeId → assigned glyphType)
    this.assignmentCache = new Map();
    
    // Statistics
    this.stats = {
      totalGlyphsCreated: 0,
      activeGlyphs: 0,
      byType: {}
    };
    
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
      dark: 0x0a0a14
    };
    
    console.log('✓ ATOMA Glyph System 3.0 initialized');
  }
  
  // ============================================================
  // GLYPH FILTERING & MAPPING (SAFE EDITION)
  // ============================================================
  
  /**
   * Determine correct glyph type for a node based on its properties
   * SAFE: Pure lookup logic, no modifications to nodes
   * 
   * Mapping Rules:
   * - Consciousness glyphs ONLY for nodes with consciousness: true
   * - Category/archetype-based routing for other glyphs
   * - Personality glyphs from userData.personality
   * - Evolution glyphs from userData.evolutionStage
   * - Special glyphs from mythology/ascended flags
   */
  getCorrectGlyphTypeForNode(node, nodeId) {
    if (!node || !node.userData) {
      return 'neutralFallback'; // Minimal fallback
    }
    
    const { userData } = node;
    const category = userData.category || 'unknown';
    const archetype = userData.archetype || null;
    const personality = userData.personality || null;
    const evolutionStage = userData.evolutionStage || 0;
    const isConsciousness = userData.consciousness === true;
    const isMythic = userData.mythicSeedActive === true;
    const isAscended = userData.ascended === true;
    
    // PRIMARY: Only AI Consciousness nodes get the cyan fractal hexagon
    if (isConsciousness && category === 'consciousness') {
      return 'aiConsciousness';
    }
    
    // If marked as consciousness but wrong category, reject it
    if (isConsciousness && category !== 'consciousness') {
      return 'neutralFallback';
    }
    
    // SECONDARY: Mythic seed state
    if (isMythic) {
      return 'mythicSeed';
    }
    
    // TERTIARY: Ascended node state
    if (isAscended) {
      return 'ascendedNode';
    }
    
    // EVOLUTION-BASED: Evolution stages 1-3
    if (evolutionStage >= 1 && evolutionStage <= 3) {
      return `evolutionStage${evolutionStage}`;
    }
    
    // PERSONALITY-BASED: Personality states override category
    if (personality) {
      const personalityMap = {
        'harmony': 'personalityHarmony',
        'instability': 'personalityInstability',
        'corruption': 'personalityCorruption',
        'synergy': 'personalitySynergy'
      };
      
      if (personalityMap[personality.toLowerCase()]) {
        return personalityMap[personality.toLowerCase()];
      }
    }
    
    // CATEGORY-BASED: Default routing based on category
    const categoryMap = {
      'input': 'evolutionStage1',           // Input nodes → diamonds
      'process': 'personalityHarmony',      // Process nodes → harmony flowers
      'integration': 'personalitySynergy',  // Integration → synergy glyphs
      'analytics': 'personalityInstability',// Analytics → instability
      'storage': 'evolutionStage2',         // Storage → evolution squares
      'control': 'personalityCorruption',   // Control → corruption
      'consciousness': 'aiConsciousness',   // Consciousness (explicit)
      'mythic': 'mythicSeed',               // Mythic category
      'ascended': 'ascendedNode'            // Ascended category
    };
    
    if (categoryMap[category]) {
      return categoryMap[category];
    }
    
    // FALLBACK: Neutral minimal glyph for unmatched nodes
    return 'neutralFallback';
  }
  
  /**
   * Create minimal fallback glyph for unmatched nodes
   * SAFE: Small, non-intrusive neutral marker
   */
  createNeutralFallbackGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'neutralFallback',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph_neutral_${nodeId}`;
    
    // Tiny subtle dot (0.05 radius)
    const dotGeo = new THREE.SphereGeometry(0.05, 6, 6);
    const dotMat = new THREE.MeshBasicMaterial({
      color: this.colors.white,
      transparent: true,
      opacity: 0.4,
      emissive: this.colors.white,
      emissiveIntensity: 0.2,
      fog: false
    });
    
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.userData = { glyphComponent: 'neutralDot' };
    glyphGroup.add(dot);
    
    glyphGroup.userData.pulsePhase = Math.random() * Math.PI * 2;
    
    this.attachGlyph(node, nodeId, glyphGroup, 'neutralFallback');
    this.recordGlyphStat('neutralFallback');
    
    return glyphGroup;
  }
  
  /**
   * Smart glyph assignment for a node
   * SAFE: Only assigns CORRECT glyph, prevents duplicates
   */
  assignGlyphToNode(node, nodeId) {
    // Skip if already has a glyph (prevent duplicates)
    if (this.glyphRegistry.has(nodeId)) {
      return; // Already assigned
    }
    
    // Get correct glyph type for this node
    const glyphType = this.getCorrectGlyphTypeForNode(node, nodeId);
    
    // Cache assignment
    this.assignmentCache.set(nodeId, glyphType);
    
    // Create appropriate glyph
    const createMethods = {
      'aiConsciousness': (n, id) => this.createAIConsciousnessGlyph(n, id),
      'mythicSeed': (n, id) => this.createMythicSeedGlyph(n, id),
      'ascendedNode': (n, id) => this.createAscendedNodeGlyph(n, id),
      'evolutionStage1': (n, id) => this.createEvolutionStage1Glyph(n, id),
      'evolutionStage2': (n, id) => this.createEvolutionStage2Glyph(n, id),
      'evolutionStage3': (n, id) => this.createEvolutionStage3Glyph(n, id),
      'personalityHarmony': (n, id) => this.createPersonalityHarmonyGlyph(n, id),
      'personalityInstability': (n, id) => this.createPersonalityInstabilityGlyph(n, id),
      'personalityCorruption': (n, id) => this.createPersonalityCorruptionGlyph(n, id),
      'personalitySynergy': (n, id) => this.createPersonalitySynergyGlyph(n, id),
      'eventMythicRitual': (n, id) => this.createEventMythicRitualGlyph(n, id),
      'eventClusterSurge': (n, id) => this.createEventClusterSurgeGlyph(n, id),
      'eventWorldEvent': (n, id) => this.createEventWorldEventGlyph(n, id),
      'neutralFallback': (n, id) => this.createNeutralFallbackGlyph(n, id)
    };
    
    if (createMethods[glyphType]) {
      createMethods[glyphType](node, nodeId);
    }
  }
  
  /**
   * Bulk-assign glyphs to multiple nodes
   * SAFE: < 0.2ms per frame for typical node count
   */
  assignGlyphsToNodes(nodes) {
    if (!nodes || nodes.length === 0) return;
    
    const startTime = performance.now();
    
    nodes.forEach((node, index) => {
      if (!node) return;
      const nodeId = node.uuid || `node-${index}`;
      this.assignGlyphToNode(node, nodeId);
    });
    
    const elapsed = performance.now() - startTime;
    if (elapsed > 0.5) {
      console.warn(`⚠ Glyph assignment took ${elapsed.toFixed(2)}ms (> 0.5ms threshold)`);
    }
  }
  
  /**
   * Debug: Print glyph mapping distribution
   * Shows how glyphs are distributed across node types
   */
  debugGlyphMapping() {
    console.group('🔍 ATOMA Glyph System 3.0 - Mapping Distribution');
    
    const distribution = {};
    for (const [nodeId, glyphType] of this.assignmentCache) {
      if (!distribution[glyphType]) {
        distribution[glyphType] = 0;
      }
      distribution[glyphType]++;
    }
    
    console.log('Total Assignments:', this.assignmentCache.size);
    console.table(distribution);
    
    // Show nodes with consciousness glyph specifically
    const consciousnessNodes = [];
    for (const [nodeId, glyphType] of this.assignmentCache) {
      if (glyphType === 'aiConsciousness') {
        consciousnessNodes.push(nodeId);
      }
    }
    
    if (consciousnessNodes.length > 0) {
      console.log('🧠 AI Consciousness Nodes:', consciousnessNodes);
    } else {
      console.log('⚠ No AI Consciousness nodes found');
    }
    
    console.groupEnd();
  }
  
  // ============================================================
  // 1) AI CONSCIOUSNESS GLYPH (Fractal Hexagon)
  // ============================================================
  
  createAIConsciousnessGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'aiConsciousness',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph_ai_${nodeId}`;
    
    // Soft neon cyan hex outline (3 rings)
    const hexGeometry = this.createHexagonGeometry(0.5, 0.35, 0.2);
    const hexMaterial = new THREE.LineBasicMaterial({
      color: this.colors.cyan,
      transparent: true,
      opacity: 0.6,
      fog: false
    });
    
    const hexMarker = new THREE.LineSegments(hexGeometry, hexMaterial);
    hexMarker.userData = { glyphComponent: 'hexOutline' };
    glyphGroup.add(hexMarker);
    
    // Inner pulse core (small sphere)
    const coreGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const coreMat = new THREE.MeshBasicMaterial({
      color: this.colors.cyan,
      transparent: true,
      opacity: 0.7,
      emissive: this.colors.cyan,
      emissiveIntensity: 0.4,
      fog: false
    });
    
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.userData = { glyphComponent: 'corePoint', isEmissive: true };
    glyphGroup.add(core);
    
    // Animation state
    glyphGroup.userData.rotation1Speed = 0.3;
    glyphGroup.userData.rotation2Speed = -0.2;
    glyphGroup.userData.pulsePhase = Math.random() * Math.PI * 2;
    
    this.attachGlyph(node, nodeId, glyphGroup, 'aiConsciousness');
    this.recordGlyphStat('aiConsciousness');
    
    return glyphGroup;
  }
  
  // ============================================================
  // 2) MYTHIC SEED GLYPH (Fractal Triangle Spiral)
  // ============================================================
  
  createMythicSeedGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'mythicSeed',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph_mythic_${nodeId}`;
    
    // 3 orbiting micro-triangles
    for (let i = 0; i < 3; i++) {
      const triGeo = new THREE.ConeGeometry(0.08, 0.15, 3);
      const triMat = new THREE.MeshBasicMaterial({
        color: this.colors.magenta,
        transparent: true,
        opacity: 0.75,
        emissive: this.colors.violet,
        emissiveIntensity: 0.3,
        fog: false
      });
      
      const tri = new THREE.Mesh(triGeo, triMat);
      tri.position.x = Math.cos((i / 3) * Math.PI * 2) * 0.35;
      tri.position.z = Math.sin((i / 3) * Math.PI * 2) * 0.35;
      tri.rotation.x = Math.PI / 2; // Point outward
      
      tri.userData = {
        glyphComponent: 'orbitTri',
        orbitIndex: i,
        orbitRadius: 0.35
      };
      
      glyphGroup.add(tri);
    }
    
    // Center pulse sphere
    const centerGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const centerMat = new THREE.MeshBasicMaterial({
      color: this.colors.magenta,
      transparent: true,
      opacity: 0.8,
      emissive: this.colors.magenta,
      emissiveIntensity: 0.5,
      fog: false
    });
    
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.userData = { glyphComponent: 'centerCore', isEmissive: true };
    glyphGroup.add(center);
    
    // Animation state
    glyphGroup.userData.orbitSpeed = 1.2;
    glyphGroup.userData.breathingPhase = Math.random() * Math.PI * 2;
    
    this.attachGlyph(node, nodeId, glyphGroup, 'mythicSeed');
    this.recordGlyphStat('mythicSeed');
    
    return glyphGroup;
  }
  
  // ============================================================
  // 3) ASCENDED NODE GLYPH (Orbital Halo Ring)
  // ============================================================
  
  createAscendedNodeGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'ascendedNode',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph_ascended_${nodeId}`;
    
    // 3 concentric halos rotating in opposite directions
    const haloRadii = [0.4, 0.55, 0.7];
    const haloColors = [this.colors.white, this.colors.blue, this.colors.cyan];
    const haloSpeeds = [0.4, -0.3, 0.25];
    
    haloRadii.forEach((radius, idx) => {
      const torus = new THREE.TorusGeometry(radius, 0.03, 16, 100);
      const mat = new THREE.LineBasicMaterial({
        color: haloColors[idx],
        transparent: true,
        opacity: 0.5 + (idx * 0.1),
        fog: false
      });
      
      const halo = new THREE.LineLoop(
        torus.getAttribute('position'),
        new THREE.BufferAttribute(new Uint16Array(torus.getIndex().array), 1)
      );
      halo.material = mat;
      
      halo.userData = {
        glyphComponent: 'haloRing',
        haloIndex: idx,
        rotationSpeed: haloSpeeds[idx]
      };
      
      glyphGroup.add(halo);
    });
    
    // Animation state
    glyphGroup.userData.haloPhases = [0, 0, 0];
    
    this.attachGlyph(node, nodeId, glyphGroup, 'ascendedNode');
    this.recordGlyphStat('ascendedNode');
    
    return glyphGroup;
  }
  
  // ============================================================
  // 4) EVOLUTION STAGE GLYPHS
  // ============================================================
  
  createEvolutionStage1Glyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'evolutionStage1',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph_evo1_${nodeId}`;
    
    // Tiny floating diamond
    const diamondGeo = new THREE.OctahedronGeometry(0.12, 1);
    const diamondMat = new THREE.MeshBasicMaterial({
      color: this.colors.mint,
      transparent: true,
      opacity: 0.7,
      emissive: this.colors.cyan,
      emissiveIntensity: 0.3,
      fog: false
    });
    
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.userData = { glyphComponent: 'diamond', isEmissive: true };
    glyphGroup.add(diamond);
    
    glyphGroup.userData.bobPhase = Math.random() * Math.PI * 2;
    glyphGroup.userData.bobAmount = 0.05;
    
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
    glyphGroup.name = `glyph_evo2_${nodeId}`;
    
    // Expanding square-loop fractal
    const squareGeo = new THREE.BufferGeometry();
    const positions = [
      // Outer square
      -0.25, 0, -0.25,  0.25, 0, -0.25,
      0.25, 0, -0.25,   0.25, 0, 0.25,
      0.25, 0, 0.25,    -0.25, 0, 0.25,
      -0.25, 0, 0.25,   -0.25, 0, -0.25,
      // Inner square
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
    
    glyphGroup.userData.rotationSpeed = 0.5;
    glyphGroup.userData.scalePhase = Math.random() * Math.PI * 2;
    
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
    glyphGroup.name = `glyph_evo3_${nodeId}`;
    
    // Elegant rotating prism
    const prismGeo = new THREE.ConeGeometry(0.2, 0.35, 6);
    const prismMat = new THREE.MeshBasicMaterial({
      color: this.colors.violet,
      transparent: true,
      opacity: 0.75,
      emissive: this.colors.magenta,
      emissiveIntensity: 0.4,
      fog: false
    });
    
    const prism = new THREE.Mesh(prismGeo, prismMat);
    prism.userData = { glyphComponent: 'prism', isEmissive: true };
    glyphGroup.add(prism);
    
    glyphGroup.userData.rotationSpeed = 0.3;
    
    this.attachGlyph(node, nodeId, glyphGroup, 'evolutionStage3');
    this.recordGlyphStat('evolutionStage3');
    
    return glyphGroup;
  }
  
  // ============================================================
  // 5) PERSONALITY STATE GLYPHS
  // ============================================================
  
  createPersonalityHarmonyGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'personalityHarmony',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph_harmony_${nodeId}`;
    
    // Lotus-shaped hex-flower (6 petals)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const petalGeo = new THREE.SphereGeometry(0.08, 6, 6);
      const petalMat = new THREE.MeshBasicMaterial({
        color: this.colors.green,
        transparent: true,
        opacity: 0.7,
        emissive: this.colors.cyan,
        emissiveIntensity: 0.3,
        fog: false
      });
      
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.x = Math.cos(angle) * 0.3;
      petal.position.z = Math.sin(angle) * 0.3;
      petal.scale.set(1.2, 0.8, 1.2);
      
      petal.userData = { glyphComponent: 'petal', petalIndex: i };
      glyphGroup.add(petal);
    }
    
    glyphGroup.userData.rotationSpeed = 0.2;
    glyphGroup.userData.pulsePhase = Math.random() * Math.PI * 2;
    
    this.attachGlyph(node, nodeId, glyphGroup, 'personalityHarmony');
    this.recordGlyphStat('personalityHarmony');
    
    return glyphGroup;
  }
  
  createPersonalityInstabilityGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'personalityInstability',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph_instability_${nodeId}`;
    
    // Chaotic shifting tetrahedrons (3 small tetra)
    for (let i = 0; i < 3; i++) {
      const tetraGeo = new THREE.TetrahedronGeometry(0.1, 0);
      const tetraMat = new THREE.MeshBasicMaterial({
        color: this.colors.red,
        transparent: true,
        opacity: 0.6,
        emissive: this.colors.gold,
        emissiveIntensity: 0.2,
        fog: false
      });
      
      const tetra = new THREE.Mesh(tetraGeo, tetraMat);
      tetra.position.set(
        (Math.random() - 0.5) * 0.4,
        0,
        (Math.random() - 0.5) * 0.4
      );
      
      tetra.userData = {
        glyphComponent: 'tetra',
        tetraIndex: i,
        chaoticOffset: Math.random() * Math.PI * 2
      };
      
      glyphGroup.add(tetra);
    }
    
    glyphGroup.userData.chaosPhase = Math.random() * Math.PI * 2;
    glyphGroup.userData.jitterAmount = 0.15;
    
    this.attachGlyph(node, nodeId, glyphGroup, 'personalityInstability');
    this.recordGlyphStat('personalityInstability');
    
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
    glyphGroup.name = `glyph_corruption_${nodeId}`;
    
    // Broken red geometry with safe flicker (no post-FX)
    const brokenGeo = new THREE.BufferGeometry();
    const brokenVerts = [];
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 0.25 + (Math.random() - 0.5) * 0.1;
      brokenVerts.push(
        Math.cos(angle) * r,
        (Math.random() - 0.5) * 0.1,
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
    broken.userData = { glyphComponent: 'brokenEdges' };
    glyphGroup.add(broken);
    
    glyphGroup.userData.flickerPhase = Math.random() * Math.PI * 2;
    glyphGroup.userData.isFlickering = true;
    
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
    glyphGroup.name = `glyph_synergy_${nodeId}`;
    
    // Twin spirals merging at center
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
      spiralLine.userData = {
        glyphComponent: 'spiral',
        spiralIndex: spiral
      };
      
      glyphGroup.add(spiralLine);
    }
    
    glyphGroup.userData.mergePhase = Math.random() * Math.PI * 2;
    glyphGroup.userData.rotationSpeed = 0.25;
    
    this.attachGlyph(node, nodeId, glyphGroup, 'personalitySynergy');
    this.recordGlyphStat('personalitySynergy');
    
    return glyphGroup;
  }
  
  // ============================================================
  // 6) EVENT GLYPHS
  // ============================================================
  
  createEventMythicRitualGlyph(node, nodeId) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      glyphType: 'eventMythicRitual',
      isVFX: true,
      noEvolve: true,
      noCleanup: true
    };
    glyphGroup.name = `glyph_ritual_${nodeId}`;
    
    // Floating tetra-wheel (4 tetrahedrons in rotation)
    for (let i = 0; i < 4; i++) {
      const tetraGeo = new THREE.TetrahedronGeometry(0.08, 0);
      const tetraMat = new THREE.MeshBasicMaterial({
        color: this.colors.magenta,
        transparent: true,
        opacity: 0.7,
        emissive: this.colors.violet,
        emissiveIntensity: 0.3,
        fog: false
      });
      
      const tetra = new THREE.Mesh(tetraGeo, tetraMat);
      const angle = (i / 4) * Math.PI * 2;
      tetra.position.x = Math.cos(angle) * 0.3;
      tetra.position.z = Math.sin(angle) * 0.3;
      tetra.rotation.y = angle;
      
      tetra.userData = { glyphComponent: 'tetraWheel', wheelIndex: i };
      glyphGroup.add(tetra);
    }
    
    glyphGroup.userData.rotationSpeed = 0.6;
    glyphGroup.userData.pulseBreathe = Math.random() * Math.PI * 2;
    
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
    glyphGroup.name = `glyph_surge_${nodeId}`;
    
    // Expanding pulse hex-grid (3 hex rings at different expansions)
    for (let ring = 0; ring < 3; ring++) {
      const hexGeo = this.createHexagonGeometry(0.4 - ring * 0.12, 0.3 - ring * 0.09, 0.2 - ring * 0.06);
      const hexMat = new THREE.LineBasicMaterial({
        color: this.colors.gold,
        transparent: true,
        opacity: 0.6 - ring * 0.1,
        fog: false
      });
      
      const hex = new THREE.LineSegments(hexGeo, hexMat);
      hex.userData = {
        glyphComponent: 'surgeHex',
        ringIndex: ring,
        baseScale: 0.4 - ring * 0.12
      };
      
      glyphGroup.add(hex);
    }
    
    glyphGroup.userData.surgePhase = Math.random() * Math.PI * 2;
    glyphGroup.userData.expandSpeed = 1.5;
    
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
    glyphGroup.name = `glyph_worldevent_${nodeId}`;
    
    // Rotating fractal sphere with orbit lines
    const sphereGeo = new THREE.IcosahedronGeometry(0.25, 2);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: this.colors.white,
      transparent: true,
      opacity: 0.3,
      emissive: this.colors.cyan,
      emissiveIntensity: 0.2,
      fog: false
    });
    
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.userData = { glyphComponent: 'fractalSphere', isEmissive: true };
    glyphGroup.add(sphere);
    
    // Orbit lines (3 axis)
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
      opacity: 0.4,
      fog: false
    });
    
    const orbits = new THREE.LineSegments(orbitGeo, orbitMat);
    orbits.userData = { glyphComponent: 'orbitLines' };
    glyphGroup.add(orbits);
    
    glyphGroup.userData.rotationSpeeds = [0.15, 0.2, 0.1];
    glyphGroup.userData.sphereRotations = [0, 0, 0];
    
    this.attachGlyph(node, nodeId, glyphGroup, 'eventWorldEvent');
    this.recordGlyphStat('eventWorldEvent');
    
    return glyphGroup;
  }
  
  // ============================================================
  // HELPER METHODS
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
  
  attachGlyph(node, nodeId, glyphGroup, glyphType) {
    if (!node || !node.parent) return;
    
    // Find or create visualGroup
    let visualGroup = node.children?.find(child => 
      child.userData?.isVisualGroup || child.name === 'visualGroup'
    );
    
    if (!visualGroup) {
      visualGroup = new THREE.Group();
      visualGroup.userData.isVisualGroup = true;
      visualGroup.name = 'visualGroup';
      node.add(visualGroup);
    }
    
    // Position glyph
    glyphGroup.position.y = 0.9;
    visualGroup.add(glyphGroup);
    
    // Register
    this.glyphRegistry.set(nodeId, {
      node,
      glyphGroup,
      glyphType,
      visualGroup
    });
    
    this.nodeToGlyph.set(glyphGroup, nodeId);
    this.stats.activeGlyphs++;
    this.stats.totalGlyphsCreated++;
  }
  
  recordGlyphStat(glyphType) {
    if (!this.stats.byType[glyphType]) {
      this.stats.byType[glyphType] = 0;
    }
    this.stats.byType[glyphType]++;
  }
  
  /**
   * Remove glyph with graceful fade-out
   */
  removeGlyph(nodeId) {
    const glyphData = this.glyphRegistry.get(nodeId);
    if (!glyphData) return;
    
    const { glyphGroup } = glyphData;
    
    // Prevent duplicate fade-outs
    if (this.fadingOut.has(nodeId)) return;
    this.fadingOut.add(nodeId);
    
    // Graceful fade-out (0.4s)
    const fadeOutDuration = 0.4;
    let elapsed = 0;
    
    const animateOut = () => {
      elapsed += 0.016;
      const progress = Math.min(elapsed / fadeOutDuration, 1.0);
      
      if (glyphGroup && glyphGroup.parent) {
        // Fade all materials
        glyphGroup.traverse((child) => {
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat.opacity !== undefined) mat.opacity *= (1 - progress);
              });
            } else if (child.material.opacity !== undefined) {
              child.material.opacity *= (1 - progress);
            }
          }
        });
        
        // Scale down
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
    
    // Remove from parent
    if (glyphGroup && glyphGroup.parent) {
      glyphGroup.parent.remove(glyphGroup);
    }
    
    // Dispose all geometries and materials
    glyphGroup.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    // Clean up registry
    this.glyphRegistry.delete(nodeId);
    this.nodeToGlyph.delete(glyphGroup);
    this.fadingOut.delete(nodeId);
    this.stats.activeGlyphs--;
  }
  
  /**
   * Replace existing glyph (elegant transition)
   */
  replaceGlyph(nodeId, newGlyphType) {
    // Fade out old glyph
    this.removeGlyph(nodeId);
    
    // Create new glyph (caller will handle this)
    // This method just triggers removal
  }
  
  /**
   * Update all glyphs (animations)
   */
  update(deltaTime) {
    for (const [nodeId, glyphData] of this.glyphRegistry) {
      const { node, glyphGroup, glyphType } = glyphData;
      
      // Safety: skip if node removed
      if (!node || !glyphGroup || !glyphGroup.parent) {
        this.disposeGlyph(nodeId);
        continue;
      }
      
      // Update based on glyph type
      switch (glyphType) {
        case 'aiConsciousness':
          this.updateAIConsciousnessGlyph(glyphGroup, deltaTime);
          break;
        case 'mythicSeed':
          this.updateMythicSeedGlyph(glyphGroup, deltaTime);
          break;
        case 'ascendedNode':
          this.updateAscendedNodeGlyph(glyphGroup, deltaTime);
          break;
        case 'evolutionStage1':
          this.updateEvolutionStage1Glyph(glyphGroup, deltaTime);
          break;
        case 'evolutionStage2':
          this.updateEvolutionStage2Glyph(glyphGroup, deltaTime);
          break;
        case 'evolutionStage3':
          this.updateEvolutionStage3Glyph(glyphGroup, deltaTime);
          break;
        case 'personalityHarmony':
          this.updatePersonalityHarmonyGlyph(glyphGroup, deltaTime);
          break;
        case 'personalityInstability':
          this.updatePersonalityInstabilityGlyph(glyphGroup, deltaTime);
          break;
        case 'personalityCorruption':
          this.updatePersonalityCorruptionGlyph(glyphGroup, deltaTime);
          break;
        case 'personalitySynergy':
          this.updatePersonalitySynergyGlyph(glyphGroup, deltaTime);
          break;
        case 'eventMythicRitual':
          this.updateEventMythicRitualGlyph(glyphGroup, deltaTime);
          break;
        case 'eventClusterSurge':
          this.updateEventClusterSurgeGlyph(glyphGroup, deltaTime);
          break;
        case 'eventWorldEvent':
          this.updateEventWorldEventGlyph(glyphGroup, deltaTime);
          break;
        case 'neutralFallback':
          this.updateNeutralFallbackGlyph(glyphGroup, deltaTime);
          break;
      }
    }
  }
  
  // Animation updaters for each glyph type
  
  updateAIConsciousnessGlyph(group, dt) {
    group.rotation.y += group.userData.rotation1Speed * dt;
    
    group.userData.pulsePhase += dt * 1.5;
    const pulse = (Math.sin(group.userData.pulsePhase) + 1) * 0.5;
    
    group.children.forEach(child => {
      if (child.userData?.glyphComponent === 'corePoint') {
        child.material.opacity = 0.4 + pulse * 0.4;
      }
    });
  }
  
  updateMythicSeedGlyph(group, dt) {
    group.userData.orbitSpeed += dt;
    
    group.children.forEach((child, idx) => {
      if (child.userData?.glyphComponent === 'orbitTri') {
        const orbitAngle = (group.userData.orbitSpeed * 2 + (idx / 3) * Math.PI * 2);
        child.position.x = Math.cos(orbitAngle) * 0.35;
        child.position.z = Math.sin(orbitAngle) * 0.35;
        child.rotation.y = orbitAngle;
      }
    });
    
    group.userData.breathingPhase += dt;
    const breathing = (Math.sin(group.userData.breathingPhase) + 1) * 0.5;
    group.scale.set(1 + breathing * 0.08, 1 + breathing * 0.08, 1 + breathing * 0.08);
  }
  
  updateAscendedNodeGlyph(group, dt) {
    group.children.forEach((child, idx) => {
      if (child.userData?.glyphComponent === 'haloRing') {
        const speed = child.userData.rotationSpeed;
        group.userData.haloPhases[idx] = (group.userData.haloPhases[idx] + speed * dt) % (Math.PI * 2);
        child.rotation.y = group.userData.haloPhases[idx];
      }
    });
  }
  
  updateEvolutionStage1Glyph(group, dt) {
    group.userData.bobPhase += dt * 2;
    const bob = Math.sin(group.userData.bobPhase) * group.userData.bobAmount;
    group.position.y = 0.9 + bob;
    
    group.rotation.x += dt * 0.3;
  }
  
  updateEvolutionStage2Glyph(group, dt) {
    group.rotation.z += group.userData.rotationSpeed * dt;
    
    group.userData.scalePhase += dt * 1.5;
    const pulse = (Math.sin(group.userData.scalePhase) + 1) * 0.5;
    group.scale.set(1 + pulse * 0.1, 1, 1 + pulse * 0.1);
  }
  
  updateEvolutionStage3Glyph(group, dt) {
    group.rotation.y += group.userData.rotationSpeed * dt;
    group.rotation.x += group.userData.rotationSpeed * 0.5 * dt;
  }
  
  updateNeutralFallbackGlyph(group, dt) {
    // Subtle gentle pulse
    group.userData.pulsePhase += dt * 0.8;
    const pulse = (Math.sin(group.userData.pulsePhase) + 1) * 0.5;
    
    group.children.forEach(child => {
      if (child.userData?.glyphComponent === 'neutralDot') {
        child.material.opacity = 0.2 + pulse * 0.2;
      }
    });
  }
  
  updatePersonalityHarmonyGlyph(group, dt) {
    group.rotation.z += group.userData.rotationSpeed * dt;
    
    group.userData.pulsePhase += dt * 1.2;
    const pulse = (Math.sin(group.userData.pulsePhase) + 1) * 0.5;
    
    group.children.forEach(child => {
      if (child.userData?.glyphComponent === 'petal') {
        child.material.opacity = 0.5 + pulse * 0.2;
      }
    });
  }
  
  updatePersonalityInstabilityGlyph(group, dt) {
    group.userData.chaosPhase += dt * 3;
    const chaos = Math.sin(group.userData.chaosPhase);
    
    group.children.forEach((child, idx) => {
      if (child.userData?.glyphComponent === 'tetra') {
        const offset = child.userData.chaoticOffset;
        child.position.x = (Math.sin(group.userData.chaosPhase + offset) - 0.5) * 0.4;
        child.position.z = (Math.cos(group.userData.chaosPhase + offset) - 0.5) * 0.4;
        child.rotation.y = group.userData.chaosPhase * (idx + 1);
      }
    });
  }
  
  updatePersonalityCorruptionGlyph(group, dt) {
    group.userData.flickerPhase += dt * 4;
    const flicker = Math.abs(Math.sin(group.userData.flickerPhase));
    
    group.children.forEach(child => {
      if (child.material && child.userData?.glyphComponent === 'brokenEdges') {
        child.material.opacity = 0.4 + flicker * 0.3;
      }
    });
    
    group.rotation.z += dt * 0.5;
  }
  
  updatePersonalitySynergyGlyph(group, dt) {
    group.rotation.x += group.userData.rotationSpeed * dt;
    group.rotation.z += group.userData.rotationSpeed * 0.8 * dt;
    
    group.userData.mergePhase += dt;
    const merge = (Math.sin(group.userData.mergePhase) + 1) * 0.5;
    group.scale.set(1 - merge * 0.05, 1, 1 - merge * 0.05);
  }
  
  updateEventMythicRitualGlyph(group, dt) {
    group.rotation.y += group.userData.rotationSpeed * dt;
    
    group.userData.pulseBreathe += dt * 1.5;
    const breathing = (Math.sin(group.userData.pulseBreathe) + 1) * 0.5;
    
    group.children.forEach(child => {
      if (child.userData?.glyphComponent === 'tetraWheel') {
        child.material.opacity = 0.5 + breathing * 0.2;
      }
    });
  }
  
  updateEventClusterSurgeGlyph(group, dt) {
    group.userData.surgePhase += dt * group.userData.expandSpeed;
    const expansion = Math.sin(group.userData.surgePhase);
    
    group.children.forEach(child => {
      if (child.userData?.glyphComponent === 'surgeHex') {
        const ringIdx = child.userData.ringIndex;
        const scale = 1 + expansion * (0.2 - ringIdx * 0.05);
        child.scale.set(scale, 1, scale);
      }
    });
  }
  
  updateEventWorldEventGlyph(group, dt) {
    group.children.forEach((child, idx) => {
      if (child.userData?.glyphComponent === 'fractalSphere') {
        child.rotation.y += group.userData.rotationSpeeds[0] * dt;
        child.rotation.x += group.userData.rotationSpeeds[1] * 0.5 * dt;
      } else if (child.userData?.glyphComponent === 'orbitLines') {
        child.rotation.y += group.userData.rotationSpeeds[2] * dt;
      }
    });
  }
  
  /**
   * Get glyph status
   */
  getStatus() {
    return {
      activeGlyphs: this.glyphRegistry.size,
      totalCreated: this.stats.totalGlyphsCreated,
      byType: this.stats.byType,
      glyphIds: Array.from(this.glyphRegistry.keys())
    };
  }
  
  /**
   * Print debug info
   */
  printStatus() {
    const status = this.getStatus();
    console.group('🌟 ATOMA Glyph System 3.0 Status');
    console.log(`Active Glyphs: ${status.activeGlyphs}`);
    console.log(`Total Created: ${status.totalCreated}`);
    console.log('By Type:', status.byType);
    if (status.glyphIds.length > 0) {
      console.log('Glyph IDs:', status.glyphIds);
    }
    console.groupEnd();
  }
  
  /**
   * Cleanup all glyphs
   */
  cleanup() {
    for (const nodeId of this.glyphRegistry.keys()) {
      this.disposeGlyph(nodeId);
    }
    
    // Clear assignment cache
    this.assignmentCache.clear();
    
    this.stats = {
      totalGlyphsCreated: 0,
      activeGlyphs: 0,
      byType: {}
    };
    
    console.log('✓ ATOMA Glyph System 3.0 cleaned up');
  }
}
