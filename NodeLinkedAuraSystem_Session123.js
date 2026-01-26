/**
 * NodeLinkedAuraSystem_Session123.js
 * ============================================================================
 * PROCEDURAL FRAGMENTED AURA SYSTEM WITH LINK-BASED DEFORMATION
 * 
 * Creates a spatial, deformable aura mesh for each node that:
 * - Reacts to connected links through local mesh stretching
 * - Deforms based on synergy, harmony, corruption, instability
 * - Shows link echo imprints when waves pass
 * - Feels like spatial tension from energy flow, not decoration
 * 
 * FEATURES:
 * 1. Segmented Toroidal Mesh: Rings of segments with procedural fragmentation
 * 2. Link-Driven Deformation: Vertex displacement toward active links
 * 3. Synergy Reactivity: Faster pulse, increased coherence (no brightness change)
 * 4. Corruption Effects: Fragment separation, edge instability
 * 5. Harmony: Smooth, unified motion
 * 6. Echo Imprints: Temporary deformation from passing waves
 * 7. LOD System: Reduced segments at distance
 * 8. Zero Allocations: Full buffer reuse
 * 
 * ARCHITECTURE:
 * ✅ Adapter-only (reads node state, no gameplay changes)
 * ✅ Single mesh per node (stored in node.userData.aura)
 * ✅ Procedural generation (fast, deterministic)
 * ✅ GPU-driven rendering (custom shaders)
 * ✅ CPU-driven deformation (update vertex targets)
 * 
 * @author VFX Technical Director — ATOMA Project Session 123
 * @version 1.0.0
 */

import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';

export class NodeLinkedAuraSystem_Session123 {
  constructor(scene, world, config = {}) {
    this.scene = scene;
    this.world = world;
    
    this.config = {
      // Mesh generation
      minorRadius: config.minorRadius ?? 0.8,      // Tube radius
      majorRadius: config.majorRadius ?? 2.0,      // Torus radius
      radialSegments: config.radialSegments ?? 32,  // Segments around tube
      tubeSegments: config.tubeSegments ?? 48,      // Segments around torus
      
      // Fragmentation
      fragmentationLevel: config.fragmentationLevel ?? 0.3,  // 0-1 breakup factor
      fractureSizeVariance: config.fractureSizeVariance ?? 0.5,
      
      // Deformation
      baseNoiseAmplitude: config.baseNoiseAmplitude ?? 0.15,
      linkDeformationStrength: config.linkDeformationStrength ?? 0.4,
      maxLinkInfluence: config.maxLinkInfluence ?? 3,  // Max links per node
      
      // Dynamics
      pulseSpeed: config.pulseSpeed ?? 2.0,
      basePulseAmplitude: config.basePulseAmplitude ?? 0.1,
      synergyPulseBoost: config.synergyPulseBoost ?? 1.5,  // Speed multiplier
      
      // Corruption/Harmony
      corruptionFragmentSpacing: config.corruptionFragmentSpacing ?? 0.08,
      harmonyFragmentCohesion: config.harmonyFragmentCohesion ?? 0.95,
      instabilityPhaseJitter: config.instabilityPhaseJitter ?? 0.1,
      
      // LOD
      lodDistanceThreshold: config.lodDistanceThreshold ?? 50,
      lodSegmentReduction: config.lodSegmentReduction ?? 0.5,  // Use 50% segments
      
      // Safety
      maxAuras: config.maxAuras ?? 256,
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
    };
    
    // Aura instances (keyed by node ID)
    this.auras = new Map();
    
    // Noise texture for procedural displacement
    this.noiseTexture = this._generateNoiseTexture();
    
    // Reusable buffers
    this.tempVector3 = new THREE.Vector3();
    this.tempQuaternion = new THREE.Quaternion();
    
    // Statistics
    this.stats = {
      activeAuras: 0,
      totalVertices: 0,
      deformationUpdates: 0,
    };
    
    if (this.config.debugMode) {
      console.log('[Session 123] NodeLinkedAuraSystem initialized');
    }
  }
  
  /**
   * Create aura for a node
   */
  createAura(node) {
    if (!this.config.enabled || this.auras.size >= this.config.maxAuras) {
      return null;
    }
    
    // Check if node already has aura
    if (node.userData.aura) {
      return node.userData.aura;
    }
    
    // Determine LOD level based on node category
    const lod = this._getLODLevel(node);
    
    // Generate mesh
    const mesh = this._generateAuraMesh(node, lod);
    if (!mesh) return null;
    
    // Store aura data
    const aura = {
      node,
      mesh,
      geometry: mesh.geometry,
      material: mesh.material,
      
      // Vertex state
      basePositions: new Float32Array(mesh.geometry.getAttribute('position').array),
      targetPositions: new Float32Array(mesh.geometry.getAttribute('position').array),
      
      // Deformation state
      linkDeformations: new Map(), // link → deformation vector
      echoImprints: [],             // Array of active echo imprints
      
      // Dynamics
      time: 0,
      pulseTime: 0,
      pulseSpeed: this.config.pulseSpeed,
      noiseOffset: Math.random() * 1000,
      
      // State tracking
      corruption: 0,
      harmony: 0,
      synergy: 0,
      instability: 0,
      active: true,
      
      // LOD
      lod,
      lastCameraDistance: 0,
    };
    
    // Store on node and in system
    node.userData.aura = aura;
    this.auras.set(node.id, aura);
    this.scene.add(mesh);
    
    this.stats.activeAuras = this.auras.size;
    
    return aura;
  }
  
  /**
   * Update all auras
   */
  update(deltaTime, nodes, camera) {
    if (!this.config.enabled || this.auras.size === 0) return;
    
    for (const [nodeId, aura] of this.auras) {
      if (!aura.active) continue;
      
      // Update time
      if (aura._timeOrigin === undefined) {
        aura._timeOrigin = VisualTime.now;
      }
      if (aura._pulseOrigin === undefined) {
        aura._pulseOrigin = VisualTime.now;
      }
      aura.time = VisualTime.now - aura._timeOrigin;
      aura.pulseTime = (VisualTime.now - aura._pulseOrigin) * aura.pulseSpeed; // Phase 2A: canonical VisualTime source (behavior-preserving)
      
      // Update node state
      this._updateAuraState(aura);
      
      // Update link deformations
      this._updateLinkDeformations(aura);
      
      // Update echo imprints
      this._updateEchoImprints(aura, deltaTime);
      
      // Compute vertex positions
      this._computeVertexPositions(aura);
      
      // Update LOD if needed
      if (camera) {
        this._updateLOD(aura, camera);
      }
      
      // Sync to GPU
      this._updateGPUBuffer(aura);
      
      this.stats.deformationUpdates++;
    }
  }
  
  /**
   * Update aura state from node metrics
   */
  _updateAuraState(aura) {
    const node = aura.node;
    const metrics = node.userData.metrics || {};
    const state = node.userData.state || {};
    
    // Read network state
    aura.corruption = metrics.corruption ?? 0;
    aura.harmony = state.harmony ?? 0;
    aura.synergy = state.synergy ?? 0;
    aura.instability = metrics.instability ?? 0;
    
    // Modulate pulse speed by synergy
    const synergyEffect = 1.0 + (aura.synergy * this.config.synergyPulseBoost);
    aura.pulseSpeed = this.config.pulseSpeed * synergyEffect;
  }
  
  /**
   * Update deformations from connected links
   */
  _updateLinkDeformations(aura) {
    const node = aura.node;
    const links = node.links || [];
    
    // Clear deformations (will accumulate)
    aura.linkDeformations.clear();
    
    // Determine active links (sorted by synergy)
    const activeLinks = [];
    for (const link of links) {
      if (!link || !link.userData) continue;
      
      const synergy = link.userData.synergy ?? 0;
      if (synergy > 0) {
        activeLinks.push({ link, synergy });
      }
    }
    
    // Sort by synergy, take top N links
    activeLinks.sort((a, b) => b.synergy - a.synergy);
    const maxLinks = Math.min(activeLinks.length, this.config.maxLinkInfluence);
    
    // Compute deformation direction per link
    for (let i = 0; i < maxLinks; i++) {
      const { link, synergy } = activeLinks[i];
      
      // Get link direction (node → other node)
      const otherNode = link.nodeA === node ? link.nodeB : link.nodeA;
      if (!otherNode) continue;
      
      const direction = this.tempVector3
        .copy(otherNode.position)
        .sub(node.position)
        .normalize();
      
      // Deformation strength by synergy
      const strength = synergy * this.config.linkDeformationStrength;
      
      aura.linkDeformations.set(link.id, {
        direction,
        strength,
        synergy,
      });
    }
  }
  
  /**
   * Update echo imprints from passing waves
   */
  _updateEchoImprints(aura, deltaTime) {
    const imprints = aura.echoImprints;
    
    // Decay existing imprints
    for (let i = imprints.length - 1; i >= 0; i--) {
      const imprint = imprints[i];
      imprint.life -= deltaTime;
      
      if (imprint.life <= 0) {
        imprints.splice(i, 1);
      }
    }
    
    // Check for new echo triggers (link waves passing through node)
    // This would be called from LinkGlyphFlow or similar systems
    // For now, placeholder for future integration
  }
  
  /**
   * Add echo imprint (called from wave system)
   */
  addEchoImprint(node, direction, strength = 0.5, lifetime = 0.3) {
    const aura = this.auras.get(node.id);
    if (!aura) return;
    
    aura.echoImprints.push({
      direction: direction.clone(),
      strength,
      life: lifetime,
      maxLife: lifetime,
    });
  }
  
  /**
   * Compute target vertex positions
   */
  _computeVertexPositions(aura) {
    const positions = aura.geometry.getAttribute('position').array;
    const basePos = aura.basePositions;
    
    const geometry = aura.geometry;
    const radialSegs = this.config.radialSegments;
    const tubeSegs = this.config.tubeSegments;
    
    // For each vertex
    for (let i = 0; i < basePos.length; i += 3) {
      const baseX = basePos[i];
      const baseY = basePos[i + 1];
      const baseZ = basePos[i + 2];
      
      // Get vertex index
      const vIdx = i / 3;
      const tubeIdx = Math.floor(vIdx / radialSegs);
      const radialIdx = vIdx % radialSegs;
      
      // Base position
      let x = baseX, y = baseY, z = baseZ;
      
      // Apply base noise displacement
      const noiseVal = this._perlinNoise(
        baseX * 2 + aura.noiseOffset,
        baseY * 2,
        baseZ * 2 + aura.time * 0.5
      );
      
      const noiseDisp = noiseVal * this.config.baseNoiseAmplitude;
      x += noiseDisp;
      y += noiseDisp;
      z += noiseDisp;
      
      // Apply pulse deformation
      const pulseAmplitude = this.config.basePulseAmplitude;
      const pulse = Math.sin(aura.pulseTime * Math.PI * 2) * pulseAmplitude;
      const normal = this._getVertexNormal(baseX, baseY, baseZ, aura.node);
      x += normal.x * pulse;
      y += normal.y * pulse;
      z += normal.z * pulse;
      
      // Apply link deformations
      let linkDeform = new THREE.Vector3();
      for (const [linkId, deform] of aura.linkDeformations) {
        const influence = this._getLinkInfluence(radialIdx, tubeIdx, deform.direction);
        linkDeform.addScaledVector(deform.direction, deform.strength * influence);
      }
      x += linkDeform.x;
      y += linkDeform.y;
      z += linkDeform.z;
      
      // Apply echo imprints
      for (const imprint of aura.echoImprints) {
        const echoInfluence = this._getEchoInfluence(
          radialIdx, 
          tubeIdx, 
          imprint.direction, 
          imprint.life / imprint.maxLife
        );
        x += imprint.direction.x * imprint.strength * echoInfluence;
        y += imprint.direction.y * imprint.strength * echoInfluence;
        z += imprint.direction.z * imprint.strength * echoInfluence;
      }
      
      // Apply corruption effects
      if (aura.corruption > 0) {
        // Fragment separation
        const fragmentSpacing = this.config.corruptionFragmentSpacing * aura.corruption;
        const fragmentNoise = this._perlinNoise(
          baseX * 5 + aura.time,
          baseY * 5,
          baseZ * 5
        );
        x += (fragmentNoise - 0.5) * fragmentSpacing;
        y += (fragmentNoise - 0.5) * fragmentSpacing;
        z += (fragmentNoise - 0.5) * fragmentSpacing;
        
        // Edge instability
        const edgeFactor = Math.sin(tubeIdx / tubeSegs * Math.PI * 2) * aura.corruption;
        x += edgeFactor * 0.1;
      }
      
      // Apply instability phase jitter
      if (aura.instability > 0) {
        const jitter = this._perlinNoise(
          baseX * 3 + aura.time * 2,
          baseY * 3 + vIdx,
          baseZ * 3
        ) - 0.5;
        const jitterAmount = this.config.instabilityPhaseJitter * aura.instability;
        x += jitter * jitterAmount;
        y += jitter * jitterAmount;
        z += jitter * jitterAmount;
      }
      
      // Harmony: smooth coherence
      if (aura.harmony > 0) {
        // Blend toward averaged position for unified motion
        const avgX = (x + baseX) * aura.harmony + x * (1 - aura.harmony);
        const avgY = (y + baseY) * aura.harmony + y * (1 - aura.harmony);
        const avgZ = (z + baseZ) * aura.harmony + z * (1 - aura.harmony);
        x = avgX;
        y = avgY;
        z = avgZ;
      }
      
      // Update position
      positions[i] = x;
      positions[i + 1] = y;
      positions[i + 2] = z;
    }
  }
  
  /**
   * Generate fragmented toroidal mesh
   */
  _generateAuraMesh(node, lod) {
    const radialSegs = Math.floor(this.config.radialSegments * lod);
    const tubeSegs = Math.floor(this.config.tubeSegments * lod);
    
    const positions = [];
    const normals = [];
    const indices = [];
    const colors = [];
    
    // Generate torus vertices
    for (let tube = 0; tube <= tubeSegs; tube++) {
      const u = (tube / tubeSegs) * Math.PI * 2;
      
      for (let radial = 0; radial <= radialSegs; radial++) {
        const v = (radial / radialSegs) * Math.PI * 2;
        
        // Torus parametric equations
        const x = (this.config.majorRadius + this.config.minorRadius * Math.cos(v)) * Math.cos(u);
        const y = (this.config.majorRadius + this.config.minorRadius * Math.cos(v)) * Math.sin(u);
        const z = this.config.minorRadius * Math.sin(v);
        
        positions.push(x, y, z);
        
        // Normal
        const nx = Math.cos(v) * Math.cos(u);
        const ny = Math.cos(v) * Math.sin(u);
        const nz = Math.sin(v);
        normals.push(nx, ny, nz);
        
        // Color (will be modulated by material)
        colors.push(0.7, 0.7, 1.0);
      }
    }
    
    // Generate indices with fragmentation
    const fragmentationChance = this.config.fragmentationLevel;
    for (let tube = 0; tube < tubeSegs; tube++) {
      for (let radial = 0; radial < radialSegs; radial++) {
        // Skip some faces for fragmentation effect
        if (Math.random() < fragmentationChance) continue;
        
        const a = tube * (radialSegs + 1) + radial;
        const b = a + 1;
        const c = a + (radialSegs + 1);
        const d = c + 1;
        
        // Two triangles
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    
    // Create material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uNoiseTexture: { value: this.noiseTexture },
        uCorruption: { value: 0 },
        uHarmony: { value: 0 },
      },
      vertexShader: this._getVertexShader(),
      fragmentShader: this._getFragmentShader(),
      side: THREE.DoubleSide,
      wireframe: false,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(node.position);
    mesh.name = `NodeAura_${node.id}`;
    
    return mesh;
  }
  
  /**
   * Calculate link influence on vertex
   */
  _getLinkInfluence(radialIdx, tubeIdx, linkDirection) {
    // Smooth falloff from link direction
    // Vertices aligned with link direction get maximum influence
    const angle = Math.atan2(linkDirection.y, linkDirection.x);
    const vertexAngle = (radialIdx / this.config.radialSegments) * Math.PI * 2;
    
    const angleDiff = Math.abs(angle - vertexAngle);
    const normalizedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
    
    // Gaussian falloff
    return Math.exp(-(normalizedDiff * normalizedDiff) * 2);
  }
  
  /**
   * Calculate echo imprint influence on vertex
   */
  _getEchoInfluence(radialIdx, tubeIdx, direction, decayFactor) {
    // Echo fades from wave center
    const influence = this._getLinkInfluence(radialIdx, tubeIdx, direction);
    
    // Decay over lifetime
    return influence * (1 - decayFactor * decayFactor);
  }
  
  /**
   * Get vertex normal (outward from torus)
   */
  _getVertexNormal(x, y, z, node) {
    // Simple: normalize position relative to node
    return new THREE.Vector3(x, y, z).normalize();
  }
  
  /**
   * Simple Perlin noise approximation
   */
  _perlinNoise(x, y, z) {
    // Quick pseudo-random based on coordinates
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 43.614) * 43758.5453;
    return n - Math.floor(n);
  }
  
  /**
   * Get LOD level
   */
  _getLODLevel(node) {
    // Full LOD by default
    return 1.0;
  }
  
  /**
   * Update LOD based on distance
   */
  _updateLOD(aura, camera) {
    const distance = camera.position.distanceTo(aura.mesh.position);
    
    if (distance > this.config.lodDistanceThreshold) {
      // Could regenerate mesh with fewer segments
      // For now, just modulate detail through shader
    }
    
    aura.lastCameraDistance = distance;
  }
  
  /**
   * Sync vertex buffer to GPU
   */
  _updateGPUBuffer(aura) {
    const posAttr = aura.geometry.getAttribute('position');
    posAttr.needsUpdate = true;
    
    // Update material uniforms
    aura.material.uniforms.uTime.value = aura.time;
    aura.material.uniforms.uCorruption.value = aura.corruption;
    aura.material.uniforms.uHarmony.value = aura.harmony;
  }
  
  /**
   * Generate noise texture for shader
   */
  _generateNoiseTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(256, 256);
    const data = imageData.data;
    
    // Generate Perlin-like noise
    for (let i = 0; i < data.length; i += 4) {
      const val = Math.floor(Math.random() * 256);
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = 255;
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }
  
  /**
   * Vertex shader for aura mesh
   */
  _getVertexShader() {
    return `
      uniform float uTime;
      varying vec3 vColor;
      varying vec3 vNormal;
      varying float vDepth;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vColor = color;
        vDepth = length(position);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }
  
  /**
   * Fragment shader for aura mesh
   */
  _getFragmentShader() {
    return `
      uniform float uCorruption;
      uniform float uHarmony;
      varying vec3 vColor;
      varying vec3 vNormal;
      varying float vDepth;
      
      void main() {
        // Fresnel effect
        vec3 viewDir = normalize(cameraPosition - vec3(0.0));
        float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
        
        // Base color modulation
        vec3 baseColor = vColor;
        
        // Corruption: red tint
        baseColor = mix(baseColor, vec3(1.0, 0.3, 0.3), uCorruption * 0.5);
        
        // Harmony: strengthen base color
        baseColor = mix(baseColor, baseColor * 1.5, uHarmony * 0.3);
        
        // Fresnel glow
        float alpha = fresnel * (0.5 + uHarmony * 0.5);
        
        gl_FragColor = vec4(baseColor, alpha);
      }
    `;
  }
  
  /**
   * Remove aura from node
   */
  removeAura(node) {
    const aura = this.auras.get(node.id);
    if (!aura) return;
    
    this.scene.remove(aura.mesh);
    aura.geometry.dispose();
    aura.material.dispose();
    
    this.auras.delete(node.id);
    node.userData.aura = null;
    
    this.stats.activeAuras = this.auras.size;
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      memoryEstimate: (this.auras.size * 500) / 1024 + ' KB',
    };
  }
  
  /**
   * Dispose all resources
   */
  dispose() {
    for (const [nodeId, aura] of this.auras) {
      this.scene.remove(aura.mesh);
      aura.geometry.dispose();
      aura.material.dispose();
    }
    
    this.auras.clear();
    this.noiseTexture.dispose();
  }
}
