/**
 * CascadeParticleSystem_Session120.js
 * ============================================================================
 * SEMANTIC PARTICLE ENCODING FOR CONFLICT CASCADES
 * 
 * Implements "Semantic Particle Encoding" where particle shape and motion
 * carry specific meaning about conflict type and flow direction.
 * 
 * FEATURES:
 * 1. Shape Encoding (What is happening?):
 *    - Phase Conflict -> Arcs/Crescents (Out of sync)
 *    - Polarity Conflict -> Forked/Split (Opposing intent)
 *    - Corruption Conflict -> Fractured Shards (Structural damage)
 *    - stability Conflict -> Irregular Blobs (Unreliable)
 * 
 * 2. Velocity Encoding (Where is influence going?):
 *    - Forward Flow -> Dominant propagation
 *    - Backflow -> Resistance/Absorption
 *    - Oscillatory -> Stalemate/Negotiation
 * 
 * ARCHITECTURE:
 * - Single GPU draw call (THREE.Points)
 * - Texture Atlas for shape switching
 * - CPU-driven motion (for complex path following)
 * - Shader-driven shape selection via attributes
 * - Zero per-frame allocations
 * 
 * @author VFX Technical Director — ATOMA Project Session 120
 * @version 1.0.0
 */

import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';

export class CascadeParticleSystem_Session120 {
  constructor(scene, config = {}) {
    this.scene = scene;
    
    this.config = {
      maxParticles: config.maxParticles ?? 3000,
      baseSize: config.baseSize ?? 4.0,
      emissionRate: config.emissionRate ?? 1.0,
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
    };
    
    // Texture Atlas Dimensions
    this.atlasSize = 128; // 128x128 texture
    this.gridSize = 2;    // 2x2 grid (4 shapes)
    
    // Particle Pool
    this.pool = [];
    this.activeCount = 0;
    
    this._cascadeTimeOrigin = undefined;
    this._lastCascadeTime = undefined;

    // Resources
    this.geometry = null;
    this.material = null;
    this.mesh = null;
    this.textureAtlas = null;
    
    // Init
    this.init();
    
    console.log('[Session 120] CascadeParticleSystem initialized');
  }
  
  /**
   * Initialize resources
   */
  init() {
    // 1. Generate Texture Atlas
    this.textureAtlas = this._generateTextureAtlas();
    
    // 2. Initialize Geometry
    this.geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(this.config.maxParticles * 3);
    const colors = new Float32Array(this.config.maxParticles * 3);
    const sizes = new Float32Array(this.config.maxParticles);
    const shapeIndices = new Float32Array(this.config.maxParticles); // 0-3 for atlas index
    const angles = new Float32Array(this.config.maxParticles); // Rotation
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('shapeIndex', new THREE.BufferAttribute(shapeIndices, 1));
    this.geometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1));
    
    // 3. Initialize Shader Material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uAtlas: { value: this.textureAtlas },
        uGridSize: { value: this.gridSize }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float shapeIndex;
        attribute float angle;
        
        varying vec3 vColor;
        varying float vShapeIndex;
        varying float vAngle;
        
        void main() {
          vColor = color;
          vShapeIndex = shapeIndex;
          vAngle = angle;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uAtlas;
        uniform float uGridSize;
        
        varying vec3 vColor;
        varying float vShapeIndex;
        varying float vAngle;
        
        void main() {
          // Rotate UVs based on angle
          float c = cos(vAngle);
          float s = sin(vAngle);
          vec2 rotUV = vec2(
            c * (gl_PointCoord.x - 0.5) - s * (gl_PointCoord.y - 0.5) + 0.5,
            s * (gl_PointCoord.x - 0.5) + c * (gl_PointCoord.y - 0.5) + 0.5
          );
          
          // Map to atlas grid
          float col = mod(vShapeIndex, uGridSize);
          float row = floor(vShapeIndex / uGridSize);
          
          // Invert row because UV y=0 is bottom
          row = (uGridSize - 1.0) - row;
          
          vec2 atlasUV = (rotUV + vec2(col, row)) / uGridSize;
          
          vec4 texColor = texture2D(uAtlas, atlasUV);
          
          gl_FragColor = vec4(vColor, 1.0) * texColor;
          
          if (gl_FragColor.a < 0.05) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    
    // 4. Create Mesh
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.frustumCulled = false; // Always render if active
    this.scene.add(this.mesh);
    
    // 5. Initialize Pool
    this._initPool();
  }
  
  /**
   * Generate Texture Atlas with 4 distinct shapes
   * 0: Arcs (Phase)
   * 1: Forks (Polarity)
   * 2: Shards (Corruption)
   * 3: Blobs (stability)
   */
  _generateTextureAtlas() {
    const canvas = document.createElement('canvas');
    canvas.width = this.atlasSize;
    canvas.height = this.atlasSize;
    const ctx = canvas.getContext('2d');
    const cell = this.atlasSize / this.gridSize; // 64px
    const half = cell / 2;
    
    ctx.fillStyle = '#00000000';
    ctx.clearRect(0, 0, this.atlasSize, this.atlasSize);
    
    // Helper to draw in cell
    const drawInCell = (col, row, fn) => {
      ctx.save();
      ctx.translate(col * cell + half, row * cell + half);
      fn(ctx, half * 0.8); // radius
      ctx.restore();
    };
    
    // Shape 0: Arcs / Crescents (Phase Conflict)
    // "Out of sync, but compatible"
    drawInCell(0, 0, (c, r) => {
      c.strokeStyle = 'white';
      c.lineWidth = 3;
      c.shadowBlur = 4;
      c.shadowColor = 'white';
      
      c.beginPath();
      c.arc(0, 0, r, Math.PI * 0.2, Math.PI * 0.8);
      c.stroke();
      
      c.beginPath();
      c.arc(0, 0, r * 0.6, Math.PI * 1.2, Math.PI * 1.8);
      c.stroke();
    });
    
    // Shape 1: Forked / Split (Polarity Conflict)
    // "Opposing intent"
    drawInCell(1, 0, (c, r) => {
      c.fillStyle = 'white';
      c.shadowBlur = 4;
      c.shadowColor = 'white';
      
      c.beginPath();
      // Y-shape
      c.moveTo(0, r);
      c.lineTo(-r * 0.6, -r);
      c.lineTo(-r * 0.2, -r);
      c.lineTo(0, -r * 0.2);
      c.lineTo(r * 0.2, -r);
      c.lineTo(r * 0.6, -r);
      c.closePath();
      c.fill();
    });
    
    // Shape 2: Fractured Shards (Corruption Conflict)
    // "Structural damage"
    drawInCell(0, 1, (c, r) => {
      c.fillStyle = 'white';
      c.shadowBlur = 2;
      c.shadowColor = 'white';
      
      // Main shard
      c.beginPath();
      c.moveTo(-r * 0.5, r * 0.5);
      c.lineTo(r * 0.6, -r * 0.4);
      c.lineTo(r * 0.2, -r * 0.8);
      c.lineTo(-r * 0.2, -r * 0.2);
      c.closePath();
      c.fill();
      
      // Small shard
      c.beginPath();
      c.moveTo(-r * 0.8, -r * 0.2);
      c.lineTo(-r * 0.4, 0);
      c.lineTo(-r * 0.6, r * 0.3);
      c.closePath();
      c.fill();
    });
    
    // Shape 3: Irregular Blobs (stability Conflict)
    // "Unreliable environment"
    drawInCell(1, 1, (c, r) => {
      c.fillStyle = 'white';
      c.shadowBlur = 6;
      c.shadowColor = 'white';
      
      c.beginPath();
      c.moveTo(r, 0);
      for(let i=0; i<8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const rad = r * (0.6 + Math.random() * 0.4);
        c.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
      }
      c.closePath();
      c.fill();
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }
  
  /**
   * Initialize Object Pool
   */
  _initPool() {
    for (let i = 0; i < this.config.maxParticles; i++) {
      this.pool.push({
        active: false,
        index: i,
        lifetime: 0,
        maxLifetime: 1.0,
        // Physics
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        // Link reference for path following
        linkRef: null,
        pathProgress: 0, // 0-1 along link
        pathDirection: 1, // 1 or -1
        pathOffset: new THREE.Vector3(), // Lateral offset
        // Semantic Data
        conflictType: 'none',
        flowType: 'forward', // forward, backflow, oscillatory
        shapeIndex: 0,
        spawnTime: 0,
      });
    }
  }
  
  /**
   * Update Loop
   */
  update(deltaTime, links) {
    if (!this.config.enabled) return;

    if (this._cascadeTimeOrigin === undefined) {
      this._cascadeTimeOrigin = VisualTime.now;
    }
    const currentCascadeTime = VisualTime.now - this._cascadeTimeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)
    const cascadeDelta = this._lastCascadeTime === undefined
      ? 0
      : Math.max(0, currentCascadeTime - this._lastCascadeTime);
    this._lastCascadeTime = currentCascadeTime;

    // 1. Spawn new particles from active cascades
    this._spawnParticles(cascadeDelta, links, currentCascadeTime);
    
    // 2. Update active particles
    this._updateParticles(cascadeDelta, currentCascadeTime);
    
    // 3. Update geometry
    this._updateGeometry();
  }
  
  /**
   * Spawn particles based on cascade intensity and emission boost
   * Respects density multiplier from Session 121
   */
  _spawnParticles(deltaTime, links, currentCascadeTime) {
    if (!links) return;
    
    for (const link of links) {
      if (!link.userData) continue;
      
      // Check for cascade activity
      const boost = link.userData.cascadeParticleEmissionBoost ?? 1.0;
      // We only care if boost > 1.0 (active cascade) OR explicit intensity
      const intensity = link.userData.cascadeIntensity ?? 0;
      
      if (intensity < 0.1 && boost <= 1.0) continue;
      
      // Determine conflict type (Semantic Shape)
      const conflictType = link.userData.cascadeConflictType ?? 'none';
      const shapeIndex = this._getShapeIndexForConflict(conflictType);
      
      // Determine Flow Type (Semantic Velocity)
      // This could be driven by hub dominance logic, but for now:
      // High conflict + low progress = Oscillatory
      // Dominant flow = Forward
      const flowType = this._determineFlowType(conflictType, intensity);
      
      // Session 121: Density Multiplier
      // Scales emission based on intensity (from ParticleSemanticDensityAdapter)
      const densityMultiplier = link.userData.particleDensityMultiplier ?? 1.0;
      
      // Calculate emission count
      // Base * Boost * DensityMultiplier * DeltaTime
      const rate = this.config.emissionRate * 10 * boost * intensity * densityMultiplier;
      const count = Math.floor(rate * deltaTime + Math.random()); // Probabilistic emission
      
      if (count > 0) {
        this._emit(count, link, shapeIndex, flowType, conflictType, currentCascadeTime);
      }
    }
  }
  
  /**
   * Emit N particles for a link
   * Respects density clustering parameters from Session 121
   */
  _emit(count, link, shapeIndex, flowType, conflictType, currentCascadeTime) {
    const curvePoints = link.userData.curvePoints;
    if (!curvePoints || curvePoints.length < 2) return;
    
    const color = link.userData.cascadeParticleColor || new THREE.Color(1, 1, 1);
    
    // Session 121: Density & Clustering
    const clusterCohesion = link.userData.particleClusterCohesion ?? 0;
    const clusterRadius = link.userData.particleClusterRadius ?? 0.2;
    const urgencyOscillation = link.userData.particleUrgencyOscillation ?? 0;
    
    for (let i = 0; i < count; i++) {
      const p = this._allocateParticle();
      if (!p) return; // Pool full
      
      p.active = true;
      p.lifetime = 0;
      p.maxLifetime = 0.5 + Math.random() * 0.5;
      p.spawnTime = currentCascadeTime;
      
      p.linkRef = link;
      p.shapeIndex = shapeIndex;
      p.conflictType = conflictType;
      p.flowType = flowType;
      
      // Position along link: respects clustering
      // High cohesion = spawn particles closer together (cluster formation)
      if (clusterCohesion > 0.5) {
        // Tight cluster: spawn within narrow band
        const clusterCenter = Math.random();
        const clusterSpread = 0.05 * (1 - clusterCohesion); // Tighter at high cohesion
        p.pathProgress = clusterCenter + (Math.random() - 0.5) * clusterSpread;
      } else {
        // Loose distribution: spread across link
        p.pathProgress = Math.random();
      }
      
      p.pathProgress = Math.max(0, Math.min(1, p.pathProgress)); // Clamp
      p.pathDirection = (flowType === 'backflow') ? -1 : 1;
      
      // Lateral offset respects cluster radius
      const offsetAmt = clusterRadius;
      p.pathOffset.set(
        (Math.random() - 0.5) * offsetAmt,
        (Math.random() - 0.5) * offsetAmt,
        (Math.random() - 0.5) * offsetAmt
      );
      
      // Color
      const colors = this.geometry.attributes.color.array;
      colors[p.index * 3] = color.r;
      colors[p.index * 3 + 1] = color.g;
      colors[p.index * 3 + 2] = color.b;
      
      // Shape
      const shapes = this.geometry.attributes.shapeIndex.array;
      shapes[p.index] = shapeIndex;
      
      // Initial update to set position
      this._updateSingleParticle(p, 0);
    }
  }
  
  /**
   * Update all active particles
   */
  _updateParticles(deltaTime, currentCascadeTime) {
    let activeCount = 0;
    
    const positions = this.geometry.attributes.position.array;
    const sizes = this.geometry.attributes.size.array;
    const angles = this.geometry.attributes.angle.array;
    
    for (let i = 0; i < this.config.maxParticles; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      
      const age = currentCascadeTime - p.spawnTime;
      p.lifetime = age;
      if (age >= p.maxLifetime) {
        p.active = false;
        // Move out of view
        positions[i * 3] = 99999;
        continue;
      }
      
      this._updateSingleParticle(p, deltaTime, currentCascadeTime);
      
      // Update Attributes
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
      
      // Fade out size
      const lifeRatio = age / p.maxLifetime;
      const fade = Math.sin(lifeRatio * Math.PI); // Smooth arc
      sizes[i] = this.config.baseSize * fade;
      
      // Rotate based on conflict type
      if (p.conflictType === 'stability' || p.conflictType === 'corruption') {
        angles[i] += deltaTime * 5.0; // Spin fast for chaos
      } else {
        // Align with path (approximation)
        angles[i] = 0; 
      }
      
      activeCount++;
    }
    
    this.activeCount = activeCount;
  }
  
  /**
   * Physics Update for Single Particle
   * Implements Task 2: Velocity Direction Encoding
   */
  _updateSingleParticle(p, deltaTime, currentCascadeTime) {
    const link = p.linkRef;
    if (!link || !link.userData.curvePoints) {
      p.active = false;
      return;
    }
    
    const points = link.userData.curvePoints;
    
    // Advance progress
    let speed = 0.5; // Base speed (link length fraction per sec)
    
    if (p.flowType === 'oscillatory') {
      // Wiggle back and forth
      const osc = Math.sin(currentCascadeTime * 0.01) * 0.01;
      p.pathProgress += osc;
    } else {
      // Forward or Backflow
      p.pathProgress += speed * deltaTime * p.pathDirection;
    }
    
    // Check bounds
    if (p.pathProgress < 0 || p.pathProgress > 1) {
      p.active = false;
      return;
    }
    
    // Interpolate position along curve
    const idx = p.pathProgress * (points.length - 1);
    const i1 = Math.floor(idx);
    const i2 = Math.min(i1 + 1, points.length - 1);
    const t = idx - i1;
    
    const p1 = points[i1];
    const p2 = points[i2];
    
    // Base position
    p.position.lerpVectors(p1, p2, t);
    
    // Add offset
    p.position.add(p.pathOffset);
    
    // Add semantic motion noise
    if (p.conflictType === 'stability') {
      p.position.x += (Math.random() - 0.5) * 0.1;
      p.position.y += (Math.random() - 0.5) * 0.1;
      p.position.z += (Math.random() - 0.5) * 0.1;
    }
  }
  
  /**
   * Determine Flow Type based on context
   */
  _determineFlowType(conflictType, intensity) {
    // 1. Oscillatory Flow (Stalemate)
    if (conflictType === 'oscillatory_balance' || conflictType === 'destructive') {
      return 'oscillatory';
    }
    
    // 2. Backflow (Resistance)
    if (conflictType === 'fatigue_yield') {
      return 'backflow';
    }
    
    // 3. Forward Flow (Dominance)
    return 'forward';
  }
  
  /**
   * Map conflict type to shape index
   */
  _getShapeIndexForConflict(type) {
    switch (type) {
      case 'destructive': return 0; // Phase (Arcs)
      case 'specialization_drift': return 1; // Polarity (Forks)
      case 'corruption': return 2; // Corruption (Shards)
      case 'oscillatory_balance': return 3; // stability (Blobs)
      case 'fatigue_yield': return 0; // Default to arcs
      case 'resolved_harmony': return 0;
      default: return 0;
    }
  }
  
  /**
   * Allocate particle from pool
   */
  _allocateParticle() {
    // Simple linear search for now (optimization: keep stack of free indices)
    // For 3000 particles, linear search is okay if pool utilization is reasonable
    for (const p of this.pool) {
      if (!p.active) return p;
    }
    return null;
  }
  
  /**
   * Mark geometry attributes for update
   */
  _updateGeometry() {
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.angle.needsUpdate = true;
    this.geometry.attributes.shapeIndex.needsUpdate = true;
  }
  
  /**
   * Cleanup
   */
  dispose() {
    this.scene.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
    this.textureAtlas.dispose();
  }
}

/**
 * Setup Adapter
 */
export function setupCascadeParticleSystem(game, options = {}) {
  try {
    const system = new CascadeParticleSystem_Session120(game.scene, options);
    game.cascadeParticleSystem = system;
    return system;
  } catch (err) {
    console.error('Failed to init CascadeParticleSystem:', err);
    return null;
  }
}
