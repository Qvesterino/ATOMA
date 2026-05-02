/**
 * PROCEDURAL MEANING ENGINE 1.0 - LIGHTWEIGHT 3D SEMANTIC GLYPHS
 * 
 * Replaces old 2D cyan hexagon glyphs with fully procedural, low-poly 3D semantic glyphs.
 * Each glyph is generated on-demand based on semantic meaning from SemanticGlyphAI.
 * 
 * DESIGN GOALS:
 * - Remove all old legacy 2D hexagon meshes
 * - Generate new 3D glyphs procedurally (no pre-made assets)
 * - Stay under 30 triangles per glyph (GPU efficient)
 * - Use MeshBasicMaterial only (zero shader complexity)
 * - Attach all geometry as children of node.visualGroup
 * - Auto-cleanup on world transitions
 * - Run < 0.4ms per frame (100 nodes)
 * 
 * GLYPH TYPES (from SemanticGlyphAI.meaningType):
 * 1. CONSCIOUSNESS - Fractal loop ring + pulsating tetra core
 * 2. STABILITY - Jittering broken-plane shards
 * 3. SYNERGY - Twin-orbit rings + lotus petals
 * 4. CORRUPTION - Fractured semi-transparent cube
 * 5. HARMONY - Floating six-petal lotus + golden glow
 * 
 * STRICT SAFETY:
 * - NO modifications to _SemanticGlyphAI.js
 * - NO modifications to AINodes.js or node lifecycle
 * - NO modifications to physics, gameplay, UI, camera, or world
 * - Reads ONLY from SemanticGlyphAI (no writes)
 * - All geometry is visual-only, child-based
 * - Zero gameplay impact
 */

import * as THREE from 'three';

export class ProceduralMeaningEngine {
  constructor(scene) {
    this.scene = scene;
    
    // Registry: nodeId → { node, glyphGroup, glyphType, fadeTimer }
    this.glyphRegistry = new Map();
    
    // Master container (keeps scene clean)
    this.glyphContainer = new THREE.Group();
    this.glyphContainer.userData.isProceduralGlyph = true;
    this.glyphContainer.name = 'ProceduralMeaningEngine_Glyphs';
    this.scene.add(this.glyphContainer);
    
    // Geometry pools (reusable, no per-frame creation)
    this.geometryPools = {
      tetrahedra: [],
      cubes: [],
      rings: [],
      planes: [],
      pyramids: []
    };
    
    // Color palette
    this.colors = {
      consciousness: 0x00CCFF,  // cyan/white blend
      stability: 0xFF3333,     // red/violet
      synergy: 0x0099FF,        // neon blue/magenta
      corruption: 0x330033,     // black/purple
      harmony: 0xFFD700         // golden
    };
    
    // Statistics
    this.stats = {
      totalGlyphs: 0,
      activeGlyphs: 0,
      removedThisFrame: 0,
      createdThisFrame: 0,
      frameTime: 0
    };
    
    // Performance tracking
    this.performanceCounter = 0;
    
    // Enable/disable
    this.enabled = true;
    
    // Initialize geometry pools
    this.initializeGeometryPools();
    
    console.log('✓ Procedural Meaning Engine 1.0 initialized');
  }
  
  /**
   * Initialize geometry pools for reuse
   */
  initializeGeometryPools() {
    // Pre-create some reusable tetrahedra (consciousness cores)
    for (let i = 0; i < 20; i++) {
      this.geometryPools.tetrahedra.push(new THREE.TetrahedronGeometry(0.04, 0));
    }
    
    // Pre-create cube geometries (corruption)
    for (let i = 0; i < 12; i++) {
      this.geometryPools.cubes.push(new THREE.BoxGeometry(0.08, 0.08, 0.08));
    }
    
    // Pre-create torus geometries (rings for synergy)
    for (let i = 0; i < 15; i++) {
      this.geometryPools.rings.push(new THREE.TorusGeometry(0.06, 0.008, 8, 32));
    }
    
    // Pre-create plane geometries (stability shards)
    for (let i = 0; i < 20; i++) {
      this.geometryPools.planes.push(new THREE.PlaneGeometry(0.05, 0.08));
    }
    
    // Pre-create cone geometries (harmony petals)
    for (let i = 0; i < 18; i++) {
      this.geometryPools.pyramids.push(new THREE.ConeGeometry(0.04, 0.12, 4));
    }
  }
  
  /**
   * Remove all legacy 2D cyan hexagon glyphs from the scene
   */
  removeLegacyHexagons() {
    const toRemove = [];
    
    // Scan entire scene for old hex glyphs
    this.scene.traverse((child) => {
      if (child.userData) {
        // Old 2D hex detection
        if (child.userData.glyphLayer3 || 
            child.userData.isOldHexGlyph ||
            (child.geometry && 
             child.geometry.type === 'PlaneGeometry' &&
             child.material && 
             child.material.color &&
             child.material.color.getHex() === 0x00FFFF)) {
          toRemove.push(child);
        }
      }
    });
    
    // Safely remove all found glyphs
    toRemove.forEach((glyph) => {
      if (glyph.parent) {
        glyph.parent.remove(glyph);
      }
      
      // Dispose geometry and material
      if (glyph.geometry) {
        glyph.geometry.dispose();
      }
      if (glyph.material) {
        if (Array.isArray(glyph.material)) {
          glyph.material.forEach(m => m.dispose());
        } else {
          glyph.material.dispose();
        }
      }
    });
    
    if (toRemove.length > 0) {
      console.log(`✓ Removed ${toRemove.length} legacy cyan hexagon glyphs`);
    }
  }
  
  /**
   * Create or update procedural glyph for a node based on semantic meaning
   */
  updateGlyph(node, nodeId, semanticData) {
    if (!this.enabled || !node || !node.visualGroup) return;
    
    const meaningType = semanticData?.meaningType || 'consciousness';
    const intensity = semanticData?.glyphIntensity || 0.5;
    const emotion = semanticData?.glyphEmotion || 'neutral';
    
    // Check if glyph already exists
    let glyphEntry = this.glyphRegistry.get(nodeId);
    
    if (!glyphEntry) {
      // Create new glyph
      glyphEntry = this.createProceduralGlyph(node, nodeId, meaningType);
      if (glyphEntry) {
        this.glyphRegistry.set(nodeId, glyphEntry);
        this.stats.createdThisFrame++;
      }
    } else {
      // Update existing glyph with new semantic data
      this.updateGlyphAppearance(glyphEntry, meaningType, intensity, emotion);
    }
    
    // Update animation
    if (glyphEntry && glyphEntry.glyphGroup) {
      this.animateGlyph(glyphEntry.glyphGroup, meaningType, intensity);
    }
  }
  
  /**
   * Create new procedural glyph based on meaning type
   */
  createProceduralGlyph(node, nodeId, meaningType) {
    const glyphGroup = new THREE.Group();
    glyphGroup.userData = {
      isProceduralGlyph: true,
      meaningType,
      nodeId
    };
    glyphGroup.name = `procedural_glyph_${nodeId}_${meaningType}`;
    
    let mesh = null;
    
    switch (meaningType) {
      case 'consciousness':
        mesh = this.createConsciousnessGlyph();
        break;
      case 'stability':
        mesh = this.createStabilityGlyph();
        break;
      case 'synergy':
        mesh = this.createSynergyGlyph();
        break;
      case 'corruption':
        mesh = this.createCorruptionGlyph();
        break;
      case 'harmony':
        mesh = this.createHarmonyGlyph();
        break;
      default:
        mesh = this.createConsciousnessGlyph();
    }
    
    if (mesh) {
      glyphGroup.add(mesh);
      
      // Attach to node's visual group
      if (node.visualGroup) {
        node.visualGroup.add(glyphGroup);
      } else {
        this.glyphContainer.add(glyphGroup);
      }
      
      this.stats.totalGlyphs++;
      this.stats.activeGlyphs++;
      
      return {
        node,
        glyphGroup,
        glyphType: meaningType,
        fadeTimer: 0,
        isRemoving: false
      };
    }
    
    return null;
  }
  
  /**
   * CONSCIOUSNESS - Fractal loop ring + pulsating tetra core
   * cyan/white blend, smooth rotation
   */
  createConsciousnessGlyph() {
    const group = new THREE.Group();
    
    // Main loop ring (torus)
    const ringGeo = this.geometryPools.rings.length > 0 
      ? this.geometryPools.rings.pop() 
      : new THREE.TorusGeometry(0.06, 0.008, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.colors.consciousness,
      transparent: true,
      opacity: 0.7,
      fog: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.userData.role = 'ring';
    group.add(ring);
    
    // Pulsating core tetrahedron
    const corGeo = this.geometryPools.tetrahedra.length > 0
      ? this.geometryPools.tetrahedra.pop()
      : new THREE.TetrahedronGeometry(0.04, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.6,
      emissive: this.colors.consciousness,
      emissiveIntensity: 0.3,
      fog: false
    });
    const core = new THREE.Mesh(corGeo, coreMat);
    core.userData.role = 'core';
    group.add(core);
    
    // Animation metadata
    group.userData = {
      type: 'consciousness',
      rotationSpeed: 0.8,
      pulsePhase: 0,
      pulseSpeed: 2.0
    };
    
    return group;
  }
  
  /**
   * STABILITY - Jittering broken-plane shards
   * red/violet gradient, chaotic motion
   */
  createStabilityGlyph() {
    const group = new THREE.Group();
    
    // Create 3-4 fractured planes in random orientations
    const shardCount = 3;
    for (let i = 0; i < shardCount; i++) {
      const shardGeo = this.geometryPools.planes.length > 0
        ? this.geometryPools.planes.pop()
        : new THREE.PlaneGeometry(0.05, 0.08);
      
      // Gradient: red to violet
      const lerpFactor = i / shardCount;
      const color = new THREE.Color().lerpColors(
        new THREE.Color(this.colors.stability),
        new THREE.Color(0x9933FF),
        lerpFactor
      );
      
      const shardMat = new THREE.MeshBasicMaterial({
        color: color.getHex(),
        transparent: true,
        opacity: 0.5 + (Math.random() * 0.3),
        side: THREE.DoubleSide,
        fog: false
      });
      
      const shard = new THREE.Mesh(shardGeo, shardMat);
      
      // Random rotation
      shard.rotation.x = Math.random() * Math.PI;
      shard.rotation.y = Math.random() * Math.PI;
      shard.rotation.z = Math.random() * Math.PI;
      
      // Slight offset
      shard.position.x = (Math.random() - 0.5) * 0.05;
      shard.position.y = (Math.random() - 0.5) * 0.05;
      shard.position.z = (Math.random() - 0.5) * 0.05;
      
      shard.userData.role = `shard_${i}`;
      shard.userData.baseRotation = {
        x: shard.rotation.x,
        y: shard.rotation.y,
        z: shard.rotation.z
      };
      
      group.add(shard);
    }
    
    // Animation metadata
    group.userData = {
      type: 'stability',
      wobbleAmplitude: 0.015,
      wobbleSpeed: 2.5,
      jitterPhase: 0
    };
    
    return group;
  }
  
  /**
   * SYNERGY - Twin-orbit rings + lotus-style petals
   * neon blue/magenta blend
   */
  createSynergyGlyph() {
    const group = new THREE.Group();
    
    // Twin orbit rings (different scales/speeds)
    const ring1Geo = this.geometryPools.rings.length > 0
      ? this.geometryPools.rings.pop()
      : new THREE.TorusGeometry(0.05, 0.006, 8, 32);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x0099FF,
      transparent: true,
      opacity: 0.6,
      fog: false
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI * 0.3;
    ring1.userData.role = 'ring1';
    group.add(ring1);
    
    const ring2Geo = this.geometryPools.rings.length > 0
      ? this.geometryPools.rings.pop()
      : new THREE.TorusGeometry(0.035, 0.006, 8, 32);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xFF00FF,
      transparent: true,
      opacity: 0.6,
      fog: false
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI * 0.7;
    ring2.userData.role = 'ring2';
    group.add(ring2);
    
    // 3 lotus petals (pyramids)
    for (let i = 0; i < 3; i++) {
      const petalGeo = this.geometryPools.pyramids.length > 0
        ? this.geometryPools.pyramids.pop()
        : new THREE.ConeGeometry(0.04, 0.12, 4);
      
      const petalMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x0099FF : 0xFF00FF,
        transparent: true,
        opacity: 0.5,
        fog: false
      });
      
      const petal = new THREE.Mesh(petalGeo, petalMat);
      const angle = (i / 3) * Math.PI * 2;
      petal.position.x = Math.cos(angle) * 0.08;
      petal.position.z = Math.sin(angle) * 0.08;
      petal.rotation.z = angle;
      petal.userData.role = `petal_${i}`;
      group.add(petal);
    }
    
    // Animation metadata
    group.userData = {
      type: 'synergy',
      ring1Speed: 1.2,
      ring2Speed: 2.0,
      petalBreatheSpeed: 1.5
    };
    
    return group;
  }
  
  /**
   * CORRUPTION - Fractured semi-transparent cube
   * black/purple blend, flickering opacity
   */
  createCorruptionGlyph() {
    const group = new THREE.Group();
    
    // Main fractured cube (split into 6 pieces)
    const cubeSize = 0.08;
    const pieceSize = cubeSize * 0.6;
    
    // 6 cube fragments (one per face, slightly offset)
    const offsets = [
      { x: pieceSize, y: 0, z: 0 },    // right
      { x: -pieceSize, y: 0, z: 0 },   // left
      { x: 0, y: pieceSize, z: 0 },    // top
      { x: 0, y: -pieceSize, z: 0 },   // bottom
      { x: 0, y: 0, z: pieceSize },    // front
      { x: 0, y: 0, z: -pieceSize }    // back
    ];
    
    for (let i = 0; i < 6; i++) {
      const fragGeo = this.geometryPools.cubes.length > 0
        ? this.geometryPools.cubes.pop()
        : new THREE.BoxGeometry(pieceSize * 0.8, pieceSize * 0.8, pieceSize * 0.8);
      
      const fragMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x330033 : 0x660066,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        fog: false
      });
      
      const fragment = new THREE.Mesh(fragGeo, fragMat);
      fragment.position.copy(offsets[i]);
      fragment.userData.role = `fragment_${i}`;
      fragment.userData.basePos = { ...offsets[i] };
      group.add(fragment);
    }
    
    // Animation metadata
    group.userData = {
      type: 'corruption',
      flickerSpeed: 3.0,
      flickerPhase: Math.random() * Math.PI * 2,
      drift: 0.01
    };
    
    return group;
  }
  
  /**
   * HARMONY - Floating six-petal lotus + golden glow
   * golden color, slow breathing scale
   */
  createHarmonyGlyph() {
    const group = new THREE.Group();
    
    // Central sphere (soft glow)
    const coreSphereGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const coreSphereMat = new THREE.MeshBasicMaterial({
      color: this.colors.harmony,
      transparent: true,
      opacity: 0.8,
      emissive: this.colors.harmony,
      emissiveIntensity: 0.5,
      fog: false
    });
    const coreSphere = new THREE.Mesh(coreSphereGeo, coreSphereMat);
    coreSphere.userData.role = 'core';
    group.add(coreSphere);
    
    // 6 lotus petals (pyramids arranged radially)
    for (let i = 0; i < 6; i++) {
      const petalGeo = this.geometryPools.pyramids.length > 0
        ? this.geometryPools.pyramids.pop()
        : new THREE.ConeGeometry(0.035, 0.1, 4);
      
      const petalMat = new THREE.MeshBasicMaterial({
        color: this.colors.harmony,
        transparent: true,
        opacity: 0.6,
        emissive: this.colors.harmony,
        emissiveIntensity: 0.2,
        fog: false
      });
      
      const petal = new THREE.Mesh(petalGeo, petalMat);
      const angle = (i / 6) * Math.PI * 2;
      petal.position.x = Math.cos(angle) * 0.1;
      petal.position.z = Math.sin(angle) * 0.1;
      petal.rotation.y = angle;
      petal.userData.role = `petal_${i}`;
      group.add(petal);
    }
    
    // Animation metadata
    group.userData = {
      type: 'harmony',
      breatheSpeed: 0.5,
      breathePhase: Math.random() * Math.PI * 2,
      minScale: 0.85,
      maxScale: 1.15,
      floatSpeed: 0.3
    };
    
    return group;
  }
  
  /**
   * Update glyph appearance based on semantic data
   */
  updateGlyphAppearance(glyphEntry, meaningType, intensity, emotion) {
    if (!glyphEntry || !glyphEntry.glyphGroup) return;
    
    const group = glyphEntry.glyphGroup;
    
    // Adjust opacity based on intensity
    group.traverse((child) => {
      if (child.material && !Array.isArray(child.material)) {
        child.material.opacity = (0.3 + intensity * 0.7);
      }
    });
    
    // Adjust emissive based on emotion
    if (emotion === 'intense' || emotion === 'stressed') {
      group.traverse((child) => {
        if (child.material && child.material.emissiveIntensity !== undefined) {
          child.material.emissiveIntensity = 0.5 + intensity * 0.5;
        }
      });
    } else if (emotion === 'calm' || emotion === 'relaxed') {
      group.traverse((child) => {
        if (child.material && child.material.emissiveIntensity !== undefined) {
          child.material.emissiveIntensity = 0.1 + intensity * 0.2;
        }
      });
    }
  }
  
  /**
   * Animate glyph based on type and intensity
   */
  animateGlyph(glyphGroup, meaningType, intensity) {
    const globalTime = Date.now() * 0.001; // seconds
    const metadata = glyphGroup.userData;
    
    switch (meaningType) {
      case 'consciousness':
        this.animateConsciousness(glyphGroup, globalTime, intensity);
        break;
      case 'stability':
        this.animateStability(glyphGroup, globalTime, intensity);
        break;
      case 'synergy':
        this.animateSynergy(glyphGroup, globalTime, intensity);
        break;
      case 'corruption':
        this.animateCorruption(glyphGroup, globalTime, intensity);
        break;
      case 'harmony':
        this.animateHarmony(glyphGroup, globalTime, intensity);
        break;
    }
  }
  
  animateConsciousness(group, time, intensity) {
    const m = group.userData;
    
    group.children.forEach((child) => {
      if (child.userData.role === 'ring') {
        child.rotation.z += m.rotationSpeed * 0.016 * (0.5 + intensity);
      } else if (child.userData.role === 'core') {
        // Pulse
        const pulse = 0.9 + Math.sin(time * m.pulseSpeed) * 0.15 * intensity;
        child.scale.set(pulse, pulse, pulse);
      }
    });
  }
  
  animateStability(group, time, intensity) {
    const m = group.userData;
    
    group.children.forEach((child) => {
      if (child.userData.role && child.userData.role.includes('shard')) {
        // Jitter rotation
        const jitter = Math.sin(time * m.wobbleSpeed * (0.5 + intensity)) * m.wobbleAmplitude;
        child.rotation.x = child.userData.baseRotation.x + jitter;
        child.rotation.y = child.userData.baseRotation.y + jitter * 0.5;
        child.rotation.z = child.userData.baseRotation.z + jitter * 0.3;
      }
    });
  }
  
  animateSynergy(group, time, intensity) {
    const m = group.userData;
    
    group.children.forEach((child) => {
      if (child.userData.role === 'ring1') {
        child.rotation.z += m.ring1Speed * 0.016 * intensity;
      } else if (child.userData.role === 'ring2') {
        child.rotation.x += m.ring2Speed * 0.016 * intensity;
      } else if (child.userData.role && child.userData.role.includes('petal')) {
        // Breathing petals
        const breathe = 0.9 + Math.sin(time * m.petalBreatheSpeed + child.userData.role.charCodeAt(0)) * 0.2 * intensity;
        child.scale.set(breathe, breathe, breathe);
      }
    });
  }
  
  animateCorruption(group, time, intensity) {
    const m = group.userData;
    
    group.children.forEach((child) => {
      if (child.userData.role && child.userData.role.includes('fragment')) {
        // Flicker opacity
        const flicker = 0.3 + Math.sin(time * m.flickerSpeed + child.userData.role.charCodeAt(0)) * 0.3 * intensity;
        if (child.material) child.material.opacity = Math.max(0.2, flicker);
        
        // Slight drift
        const drift = Math.sin(time * m.drift + child.userData.role.charCodeAt(0)) * 0.02;
        child.position.x = child.userData.basePos.x + drift;
        child.position.y = child.userData.basePos.y + drift * 0.5;
      }
    });
  }
  
  animateHarmony(group, time, intensity) {
    const m = group.userData;
    
    group.children.forEach((child) => {
      if (child.userData.role === 'core') {
        // Breathing scale
        const breathe = m.minScale + (m.maxScale - m.minScale) * 
          (0.5 + Math.sin(time * m.breatheSpeed) * 0.5) * (0.7 + intensity * 0.3);
        child.scale.set(breathe, breathe, breathe);
        
        // Float up/down
        const float = Math.sin(time * m.floatSpeed) * 0.02 * intensity;
        child.position.y = float;
      } else if (child.userData.role && child.userData.role.includes('petal')) {
        // Petal rotation + scale
        const baseAngle = (parseInt(child.userData.role) / 6) * Math.PI * 2;
        child.rotation.z = baseAngle + time * m.breatheSpeed * intensity;
      }
    });
  }
  
  /**
   * Remove glyph (with fade-out)
   */
  removeGlyph(nodeId, fadeOutTime = 0.4) {
    const glyphEntry = this.glyphRegistry.get(nodeId);
    if (!glyphEntry) return;
    
    glyphEntry.isRemoving = true;
    glyphEntry.fadeTimer = 0;
    glyphEntry.fadeDuration = fadeOutTime;
  }
  
  /**
   * Cleanup all glyphs and dispose resources
   */
  cleanup() {
    // Fade out and remove all glyphs
    this.glyphRegistry.forEach((entry) => {
      this.removeGlyph(entry.node.userData.nodeId || 'unknown');
    });
    
    // Dispose all pooled geometries
    Object.values(this.geometryPools).forEach((pool) => {
      pool.forEach((geo) => {
        geo.dispose();
      });
    });
    
    // Remove container from scene
    if (this.glyphContainer.parent) {
      this.glyphContainer.parent.remove(this.glyphContainer);
    }
    
    this.glyphRegistry.clear();
    console.log('✓ Procedural Meaning Engine cleaned up');
  }
  
  /**
   * Main update loop - call from main.js animate()
   */
  update(dt, nodes, semanticGlyphAI) {
    if (!this.enabled) return;
    
    const startTime = performance.now();
    
    this.stats.createdThisFrame = 0;
    this.stats.removedThisFrame = 0;
    
    // Update existing glyphs
    if (nodes) {
      nodes.forEach((node, index) => {
        const nodeId = node.userData?.nodeId || `node-${index}`;
        
        // Get semantic data from SemanticGlyphAI
        const semanticState = semanticGlyphAI?.semanticState?.get(nodeId);
        if (semanticState) {
          this.updateGlyph(node, nodeId, {
            meaningType: semanticState.state || 'consciousness',
            glyphIntensity: semanticState.parameters?.intensity || 0.5,
            glyphEmotion: semanticState.parameters?.emotion || 'neutral'
          });
        }
      });
    }
    
    // Update fading glyphs
    this.glyphRegistry.forEach((entry, nodeId) => {
      if (entry.isRemoving) {
        entry.fadeTimer += dt;
        const progress = entry.fadeTimer / entry.fadeDuration;
        
        if (progress >= 1.0) {
          // Fully faded, remove
          if (entry.glyphGroup && entry.glyphGroup.parent) {
            entry.glyphGroup.parent.remove(entry.glyphGroup);
          }
          this.glyphRegistry.delete(nodeId);
          this.stats.removedThisFrame++;
          this.stats.activeGlyphs--;
        } else {
          // Fade out
          entry.glyphGroup.traverse((child) => {
            if (child.material && !Array.isArray(child.material)) {
              child.material.opacity *= (1.0 - progress);
            }
          });
        }
      }
    });
    
    this.stats.frameTime = performance.now() - startTime;
    this.stats.activeGlyphs = this.glyphRegistry.size;
  }
  
  /**
   * Debug function - inspect all glyphs
   */
  debugRemoveLegacyHex() {
    console.log('🔍 Scanning for legacy 2D cyan hexagon glyphs...');
    this.removeLegacyHexagons();
    console.log(`✓ Cleanup complete`);
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      registrySize: this.glyphRegistry.size
    };
  }
}
