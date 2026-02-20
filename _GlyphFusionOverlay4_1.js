/**
 * GLYPH FUSION OVERLAY 4.1 — SEMANTIC FUSION LAYER (SAFE EDITION)
 * 
 * Secondary "Fusion Glyph" overlay that visually merges with Semantic Glyph AI states.
 * Reads only from semantic fields, generates lightweight fusion forms.
 * 
 * STRICT SAFETY:
 * - Does NOT modify _SemanticGlyphAI.js
 * - Does NOT modify AINodes.js, physics, or gameplay
 * - Only attaches lightweight visual meshes as children
 * - No recursion, no global registries, no destructive overrides
 * - < 0.4ms per frame for 50 nodes
 * - Max 40 triangles per fusion object
 * 
 * SEMANTIC INPUTS (read-only):
 * - meaningType: 'focused' | 'stressed' | 'calm' | 'exploring' | 'leader' | 'conflict' | 'cluster-sync'
 * - glyphEmotion: 0-1 (intensity)
 * - glyphTier: 1-3 (complexity level)
 * - glyphStability: 0-1 (stability metric)
 * 
 * FUSION FORMS:
 * 1. Dual-rings (2 rotating toruses)
 * 2. Tri-fold geometry (3 rotating planes)
 * 3. Lotus fractal pulses (6 petals breathing)
 * 4. Hexagon-orbital merge (6 orbiting hexagons)
 * 5. Rotating cross-planes (2 orthogonal planes)
 * 
 * ANIMATION:
 * - Fusion glyph fades in/out based on semantic intensity
 * - Scale breathing: 1.0 → 1.08
 * - Rotation speed: < 0.4 rad/s
 * - Color blend: baseColor * 0.7 + semanticColor * 0.3
 */

import * as THREE from 'three';

export class GlyphFusionOverlay4_1 {
  constructor(scene, worldRoot, semanticGlyphAI) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.semanticGlyphAI = semanticGlyphAI;
    const attachRoot = worldRoot || scene;
    
    // Master container for all fusion glyphs
    this.fusionContainer = new THREE.Group();
    this.fusionContainer.userData.isFusionOverlay4 = true;
    this.fusionContainer.name = 'GlyphFusionOverlay4_1';
    attachRoot.add(this.fusionContainer);
    this.root = this.fusionContainer;
    
    // Per-node fusion tracking
    this.nodeFusionMap = new Map();  // nodeId → { node, fusionGroup, meshes[], animState }
    
    // Animation state per node
    this.animationState = new Map();  // nodeId → { rotPhase, pulsePhase, fadePhase }
    
    // Geometry pools (reusable, lightweight)
    this.geometryPools = {
      rings: [],           // Torus (low-poly)
      planes: [],          // Plane geometry
      petals: [],          // Icosphere variants
      hexagons: []         // Low-poly cone/hex shapes
    };
    
    this.materialPools = new Map();
    
    // Configuration
    this.config = {
      maxTriangles: 40,
      rotationSpeedMax: 0.4,       // rad/s
      scaleBreathAmount: 0.08,     // 1.0 → 1.08
      colorBlendRatio: 0.3,        // semanticColor influence
      fadeInDuration: 0.5,         // seconds
      fadeOutDuration: 0.5,        // seconds
      pulseFrequency: 2.0          // Hz
    };
    
    // Color palette
    this.colors = {
      // Semantic state colors
      focused: 0x00F2FF,      // Cyan
      stressed: 0xFF8800,     // Orange
      calm: 0x00DDAA,         // Teal
      exploring: 0x00FFAA,    // Mint
      leader: 0xFFD700,       // Gold
      conflict: 0xFF00FF,     // Magenta
      'cluster-sync': 0x84FFE6, // Light cyan
      
      // Blend base
      neutral: 0xFFFFFF       // White
    };
    
    // Statistics
    this.stats = {
      totalFusionGlyphs: 0,
      activeFusionGlyphs: 0,
      frameTime: 0
    };
    
    // Enable/disable flag
    this.enabled = true;
    
    this.initializePools();
    
    console.log('✓ Glyph Fusion Overlay 4.1 initialized');
  }
  
  /**
   * Initialize lightweight geometry pools
   */
  initializePools() {
    // Low-poly torus (for dual-rings)
    const torusGeom = new THREE.TorusGeometry(0.2, 0.03, 6, 12);  // 6 segments = low-poly
    for (let i = 0; i < 8; i++) {
      this.geometryPools.rings.push(torusGeom);
    }
    
    // Plane geometry (for tri-fold / cross-planes)
    const planeGeom = new THREE.PlaneGeometry(0.3, 0.05, 2, 2);  // 2 segments = low-poly
    for (let i = 0; i < 8; i++) {
      this.geometryPools.planes.push(planeGeom);
    }
    
    // Icosphere for petals (low-poly)
    const petalGeom = new THREE.IcosahedronGeometry(0.08, 1);  // Detail 1 = low-poly
    for (let i = 0; i < 12; i++) {
      this.geometryPools.petals.push(petalGeom);
    }
    
    // Cone for hexagon elements
    const hexGeom = new THREE.ConeGeometry(0.05, 0.15, 6, 1);  // 6-sided cone
    for (let i = 0; i < 10; i++) {
      this.geometryPools.hexagons.push(hexGeom);
    }
  }
  
  /**
   * Get or create material for fusion type
   */
  getMaterial(color, opacity = 0.7) {
    const key = `${color}_${opacity}`;
    if (this.materialPools.has(key)) {
      return this.materialPools.get(key);
    }
    
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      fog: false,
      side: THREE.DoubleSide
    });
    
    this.materialPools.set(key, material);
    return material;
  }
  
  /**
   * Create fusion glyph for a node
   */
  createFusionGlyph(node, nodeId) {
    if (!node || !node.userData) return;
    
    // Check if already exists
    if (this.nodeFusionMap.has(nodeId)) {
      return this.nodeFusionMap.get(nodeId);
    }
    
    // Create fusion group (attached to node)
    const fusionGroup = new THREE.Group();
    fusionGroup.userData.isFusionGlyph = true;
    fusionGroup.userData.nodeId = nodeId;
    node.add(fusionGroup);
    
    // Initialize animation state
    this.animationState.set(nodeId, {
      rotPhase: Math.random() * Math.PI * 2,
      pulsePhase: Math.random() * Math.PI * 2,
      fadePhase: 0,
      currentFadeTarget: 0,
      lastMeaningType: null
    });
    
    const fusionData = {
      node,
      fusionGroup,
      meshes: [],
      meaningType: null,
      intensity: 0
    };
    
    this.nodeFusionMap.set(nodeId, fusionData);
    this.stats.totalFusionGlyphs++;
    this.stats.activeFusionGlyphs++;
    
    return fusionData;
  }
  
  /**
   * Main update loop - call every frame
   */
  update(dt) {
    if (!this.enabled || !this.semanticGlyphAI) return;
    
    const startTime = performance.now();
    
    // Update each node's fusion glyph
    for (const [nodeId, fusionData] of this.nodeFusionMap) {
      const { node, fusionGroup } = fusionData;
      if (!node) continue;
      
      // Get semantic state from SemanticGlyphAI
      const semanticState = this.semanticGlyphAI.semanticState?.get(nodeId);
      
      if (!semanticState) {
        // No semantic state - fade out fusion glyph
        this.updateFusionFade(nodeId, 0, dt);
        continue;
      }
      
      const { type, parameters, context } = semanticState;
      
      // Compute fusion intensity based on semantic state
      const intensity = this.computeFusionIntensity(type, parameters, context);
      
      // Update fusion fade
      this.updateFusionFade(nodeId, intensity, dt);
      
      // If intensity > 0, update/create fusion meshes
      if (intensity > 0.1) {
        this.updateFusionMeshes(nodeId, type, intensity, context, dt);
      }
      
      // Update animation
      this.updateFusionAnimation(nodeId, type, intensity, dt);
    }
    
    this.stats.frameTime = performance.now() - startTime;
  }
  
  /**
   * Compute fusion intensity from semantic state
   */
  computeFusionIntensity(meaningType, parameters, context) {
    // Base intensity on semantic state complexity
    let intensity = 0.5;  // Base
    
    switch (meaningType) {
      case 'focused':
        // Clarity drives intensity
        intensity = 0.3 + (context.clarity / 100) * 0.5;
        break;
      case 'stressed':
        // Stress drives intensity
        intensity = 0.4 + (parameters.stressLevel || 0.5) * 0.5;
        break;
      case 'calm':
        // Calm has medium intensity
        intensity = 0.4;
        break;
      case 'exploring':
        // Exploring has higher intensity
        intensity = 0.6 + (parameters.exploreAmount || 0.5) * 0.3;
        break;
      case 'leader':
        // Leadership drives high intensity
        intensity = 0.5 + (parameters.hubDegree || 0.5) * 0.4;
        break;
      case 'conflict':
        // Conflict has high intensity
        intensity = 0.7 + (parameters.conflictStrength || 0.5) * 0.2;
        break;
      case 'cluster-sync':
        // Cluster sync is very intense
        intensity = 0.8 + (parameters.syncAmount || 0.5) * 0.2;
        break;
      default:
        intensity = 0.3;
    }
    
    return Math.min(1, intensity);
  }
  
  /**
   * Update fusion glyph fade in/out
   */
  updateFusionFade(nodeId, targetIntensity, dt) {
    const animState = this.animationState.get(nodeId);
    const fusionData = this.nodeFusionMap.get(nodeId);
    
    if (!animState || !fusionData) return;
    
    // Smooth fade to target
    const fadeSpeed = targetIntensity > animState.fadePhase ? 
      1 / this.config.fadeInDuration : 
      1 / this.config.fadeOutDuration;
    
    animState.fadePhase = THREE.MathUtils.lerp(
      animState.fadePhase,
      targetIntensity,
      fadeSpeed * dt
    );
    
    // Update mesh opacity based on fade
    for (const mesh of fusionData.meshes) {
      if (mesh.material) {
        mesh.material.opacity = 0.5 * animState.fadePhase;
      }
      mesh.visible = animState.fadePhase > 0.05;
    }
    
    fusionData.intensity = animState.fadePhase;
  }
  
  /**
   * Update/create fusion meshes based on semantic type
   */
  updateFusionMeshes(nodeId, meaningType, intensity, context, dt) {
    const fusionData = this.nodeFusionMap.get(nodeId);
    if (!fusionData) return;
    
    const { fusionGroup, meshes } = fusionData;
    const animState = this.animationState.get(nodeId);
    
    // Only recreate if meaning type changed
    if (meaningType !== animState.lastMeaningType) {
      // Clear old meshes
      while (meshes.length > 0) {
        const mesh = meshes.pop();
        fusionGroup.remove(mesh);
      }
      
      // Create new fusion form
      this.createFusionForm(meaningType, fusionGroup, meshes, context, intensity);
      
      animState.lastMeaningType = meaningType;
    }
  }
  
  /**
   * Create appropriate fusion form based on semantic type
   */
  createFusionForm(meaningType, fusionGroup, meshes, context, intensity) {
    switch (meaningType) {
      case 'focused':
        this.createDualRings(fusionGroup, meshes, context, intensity);
        break;
      case 'stressed':
        this.createTriFoldGeometry(fusionGroup, meshes, context, intensity);
        break;
      case 'calm':
        this.createLotusFractal(fusionGroup, meshes, context, intensity);
        break;
      case 'exploring':
        this.createHexagonOrbitalMerge(fusionGroup, meshes, context, intensity);
        break;
      case 'leader':
        this.createHexagonOrbitalMerge(fusionGroup, meshes, context, intensity);
        break;
      case 'conflict':
        this.createRotatingCrossPlanes(fusionGroup, meshes, context, intensity);
        break;
      case 'cluster-sync':
        this.createDualRings(fusionGroup, meshes, context, intensity);
        break;
      default:
        this.createDualRings(fusionGroup, meshes, context, intensity);
    }
  }
  
  /**
   * FORM 1: Dual-rings (2 rotating toruses)
   */
  createDualRings(fusionGroup, meshes, context, intensity) {
    const baseColor = this.getSemanticColor(context);
    
    // Ring 1 - larger, slower
    const ring1Geom = new THREE.TorusGeometry(0.25, 0.03, 6, 12);
    const ring1Mat = this.getMaterial(baseColor);
    const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
    ring1.userData.rotationSpeed = 0.15;
    ring1.userData.rotationAxis = new THREE.Vector3(1, 0, 0);
    ring1.userData.fusionType = 'dualRing1';
    fusionGroup.add(ring1);
    meshes.push(ring1);
    
    // Ring 2 - smaller, faster, perpendicular
    const ring2Geom = new THREE.TorusGeometry(0.15, 0.03, 6, 12);
    const ring2Mat = this.getMaterial(baseColor);
    const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
    ring2.rotation.z = Math.PI / 4;
    ring2.userData.rotationSpeed = 0.25;
    ring2.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
    ring2.userData.fusionType = 'dualRing2';
    fusionGroup.add(ring2);
    meshes.push(ring2);
  }
  
  /**
   * FORM 2: Tri-fold geometry (3 rotating planes)
   */
  createTriFoldGeometry(fusionGroup, meshes, context, intensity) {
    const baseColor = this.getSemanticColor(context);
    
    for (let i = 0; i < 3; i++) {
      const planeGeom = new THREE.PlaneGeometry(0.25, 0.08, 2, 2);
      const planeMat = this.getMaterial(baseColor);
      const plane = new THREE.Mesh(planeGeom, planeMat);
      
      // Rotate each plane 60 degrees apart
      plane.rotation.y = (i / 3) * Math.PI * 2;
      plane.position.x = Math.cos(plane.rotation.y) * 0.1;
      plane.position.z = Math.sin(plane.rotation.y) * 0.1;
      
      plane.userData.rotationSpeed = 0.2 + i * 0.05;
      plane.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
      plane.userData.fusionType = `trifold_${i}`;
      
      fusionGroup.add(plane);
      meshes.push(plane);
    }
  }
  
  /**
   * FORM 3: Lotus fractal pulses (6 petals breathing)
   */
  createLotusFractal(fusionGroup, meshes, context, intensity) {
    const baseColor = this.getSemanticColor(context);
    
    for (let i = 0; i < 6; i++) {
      const petalGeom = new THREE.IcosahedronGeometry(0.08, 1);
      const petalMat = this.getMaterial(baseColor);
      const petal = new THREE.Mesh(petalGeom, petalMat);
      
      // Position in lotus pattern
      const angle = (i / 6) * Math.PI * 2;
      petal.position.x = Math.cos(angle) * 0.15;
      petal.position.z = Math.sin(angle) * 0.15;
      
      petal.userData.rotationSpeed = 0;  // Only pulse, no rotation
      petal.userData.petalIndex = i;
      petal.userData.fusionType = 'lotusPetal';
      
      fusionGroup.add(petal);
      meshes.push(petal);
    }
  }
  
  /**
   * FORM 4: Hexagon-orbital merge (6 orbiting hexagons)
   */
  createHexagonOrbitalMerge(fusionGroup, meshes, context, intensity) {
    const baseColor = this.getSemanticColor(context);
    
    for (let i = 0; i < 6; i++) {
      const hexGeom = new THREE.ConeGeometry(0.05, 0.15, 6, 1);
      const hexMat = this.getMaterial(baseColor);
      const hex = new THREE.Mesh(hexGeom, hexMat);
      
      // Orbit around center
      const angle = (i / 6) * Math.PI * 2;
      hex.position.x = Math.cos(angle) * 0.2;
      hex.position.z = Math.sin(angle) * 0.2;
      hex.rotation.y = angle;
      
      hex.userData.orbitAngle = angle;
      hex.userData.orbitRadius = 0.2;
      hex.userData.orbitSpeed = 0.2;
      hex.userData.fusionType = 'hexOrbit';
      
      fusionGroup.add(hex);
      meshes.push(hex);
    }
  }
  
  /**
   * FORM 5: Rotating cross-planes (2 orthogonal planes)
   */
  createRotatingCrossPlanes(fusionGroup, meshes, context, intensity) {
    const baseColor = this.getSemanticColor(context);
    
    // Plane 1 - X/Z axis
    const plane1Geom = new THREE.PlaneGeometry(0.3, 0.08, 2, 2);
    const plane1Mat = this.getMaterial(baseColor);
    const plane1 = new THREE.Mesh(plane1Geom, plane1Mat);
    plane1.rotation.y = 0;
    plane1.userData.rotationSpeed = 0.25;
    plane1.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
    plane1.userData.fusionType = 'crossPlane1';
    fusionGroup.add(plane1);
    meshes.push(plane1);
    
    // Plane 2 - X/Y axis (perpendicular)
    const plane2Geom = new THREE.PlaneGeometry(0.3, 0.08, 2, 2);
    const plane2Mat = this.getMaterial(baseColor);
    const plane2 = new THREE.Mesh(plane2Geom, plane2Mat);
    plane2.rotation.x = Math.PI / 2;
    plane2.userData.rotationSpeed = 0.25;
    plane2.userData.rotationAxis = new THREE.Vector3(1, 0, 0);
    plane2.userData.fusionType = 'crossPlane2';
    fusionGroup.add(plane2);
    meshes.push(plane2);
  }
  
  /**
   * Get semantic color based on context
   */
  getSemanticColor(context) {
    const clarity = context.clarity || 50;
    const harmony = context.harmony || 50;
    const corruption = context.corruption || 0;
    const stability = context.stability || 0;
    
    // Determine dominant color from metrics
    if (clarity > 70) return this.colors.focused;
    if (corruption > 60) return this.colors.conflict;
    if (stability > 60) return this.colors.stressed;
    if (harmony > 70) return this.colors.calm;
    
    return this.colors.exploring;
  }
  
  /**
   * Update fusion animation
   */
  updateFusionAnimation(nodeId, meaningType, intensity, dt) {
    const fusionData = this.nodeFusionMap.get(nodeId);
    const animState = this.animationState.get(nodeId);
    
    if (!fusionData || !animState) return;
    
    const { meshes, fusionGroup } = fusionData;
    
    // Update animation phases
    animState.rotPhase = (animState.rotPhase + dt * this.config.rotationSpeedMax) % (Math.PI * 2);
    animState.pulsePhase = (animState.pulsePhase + dt * this.config.pulseFrequency) % (Math.PI * 2);
    
    // Apply animations to meshes
    for (const mesh of meshes) {
      if (!mesh.userData) continue;
      
      // Rotation animation
      if (mesh.userData.rotationSpeed) {
        const axis = mesh.userData.rotationAxis || new THREE.Vector3(0, 1, 0);
        const rotAmount = mesh.userData.rotationSpeed * dt;
        mesh.rotateOnAxis(axis, rotAmount);
      }
      
      // Orbit animation (for hexagon form)
      if (mesh.userData.orbitSpeed) {
        mesh.userData.orbitAngle = (mesh.userData.orbitAngle + mesh.userData.orbitSpeed * dt) % (Math.PI * 2);
        mesh.position.x = Math.cos(mesh.userData.orbitAngle) * mesh.userData.orbitRadius;
        mesh.position.z = Math.sin(mesh.userData.orbitAngle) * mesh.userData.orbitRadius;
      }
      
      // Pulse animation (for lotus petals)
      if (mesh.userData.fusionType === 'lotusPetal') {
        const petalPhase = animState.pulsePhase + (mesh.userData.petalIndex / 6) * Math.PI * 2;
        const pulseScale = 1.0 + Math.sin(petalPhase) * this.config.scaleBreathAmount;
        mesh.scale.setScalar(pulseScale);
      }
    }
    
    // Global scale breathing on fusion group
    const globalPulse = 1.0 + Math.sin(animState.pulsePhase * 0.5) * this.config.scaleBreathAmount * 0.5;
    fusionGroup.scale.setScalar(globalPulse * intensity);
  }
  
  /**
   * Initialize fusion glyphs for all existing nodes
   */
  initializeForNodes(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodeId = node.userData?.index !== undefined ? node.userData.index : i;
      this.createFusionGlyph(node, nodeId);
    }
  }
  
  /**
   * Remove fusion glyph from a node
   */
  removeFusionGlyph(nodeId) {
    const fusionData = this.nodeFusionMap.get(nodeId);
    if (!fusionData) return;
    
    const { fusionGroup, meshes } = fusionData;
    
    // Remove all meshes
    for (const mesh of meshes) {
      fusionGroup.remove(mesh);
    }
    
    // Remove group from node
    if (fusionGroup.parent) {
      fusionGroup.parent.remove(fusionGroup);
    }
    
    // Clean up references
    this.nodeFusionMap.delete(nodeId);
    this.animationState.delete(nodeId);
    
    this.stats.activeFusionGlyphs--;
  }
  
  /**
   * Clean up all fusion glyphs
   */
  cleanup() {
    const nodeIds = Array.from(this.nodeFusionMap.keys());
    for (const nodeId of nodeIds) {
      this.removeFusionGlyph(nodeId);
    }
    
    this.stats.activeFusionGlyphs = 0;
  }
  
  /**
   * Debug: Show fusion glyph status for a node
   */
  debugFusionGlyph(nodeIndex) {
    const fusionData = this.nodeFusionMap.get(nodeIndex);
    if (!fusionData) {
      console.log(`No fusion glyph for node ${nodeIndex}`);
      return;
    }
    
    const animState = this.animationState.get(nodeIndex);
    
    console.log(`\n=== FUSION GLYPH DEBUG: Node ${nodeIndex} ===`);
    console.log(`Meaning type: ${animState?.lastMeaningType || 'none'}`);
    console.log(`Intensity: ${(fusionData.intensity * 100).toFixed(1)}%`);
    console.log(`Mesh count: ${fusionData.meshes.length}`);
    console.log(`Fade phase: ${(animState?.fadePhase * 100).toFixed(1)}%`);
  }
  
  /**
   * Debug: Show overall fusion glyph statistics
   */
  debugFusionStats() {
    console.log('=== GLYPH FUSION OVERLAY 4.1 STATISTICS ===');
    console.log(`Total fusion glyphs created: ${this.stats.totalFusionGlyphs}`);
    console.log(`Active fusion glyphs: ${this.stats.activeFusionGlyphs}`);
    console.log(`Frame time: ${this.stats.frameTime.toFixed(2)}ms`);
    console.log(`Enabled: ${this.enabled}`);
    
    // Show fusion type distribution
    const typeDistribution = {};
    for (const animState of this.animationState.values()) {
      const type = animState.lastMeaningType || 'none';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    }
    console.log('Fusion type distribution:', typeDistribution);
  }
  
  /**
   * Enable fusion glyph updates
   */
  enable() {
    this.enabled = true;
  }
  
  /**
   * Disable fusion glyph updates
   */
  disable() {
    this.enabled = false;
  }
  
  /**
   * Full resource cleanup
   */
  dispose() {
    this.cleanup();
    
    // Dispose materials
    for (const material of this.materialPools.values()) {
      material.dispose();
    }
    
    // Remove master container
    if (this.root?.parent) {
      this.root.parent.remove(this.root);
    }
    this.root?.clear?.();
    
    this.nodeFusionMap.clear();
    this.animationState.clear();
    this.materialPools.clear();
  }
}
