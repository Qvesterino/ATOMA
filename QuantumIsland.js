import * as THREE from 'three';
import { initMapReferencePlane } from './MapReferencePlaneFactory.js';
import { getMapConfig } from './MapConfigBase.js';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';

/**
 * Quantum Island - Floating landmass in singularity void
 * Represents quantum instability in AI dream state
 */
export class QuantumIsland {
  constructor({ scene, worldRoot, camera = null }) {
    console.log('WORLD CONSTRUCTOR:', this.constructor.name);
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.camera = camera;
    this.orbitingRocks = [];
    this.floatingShards = [];
    this.filaments = [];
    this.glitchRibbons = [];
    this.fractalPatterns = [];
    
    // Session 112+: Initialize map reference plane from config
    this.initializeMapConfig();
    this.initializeReferencePlane();
    
    this.createIsland();
    this.createVortexVoid();
    this.createOrbitingRocks();
    this.createFilaments();
    this.createFloatingShards();
    this.createQuantumParticles();
    this.createGlitchRibbons();
    this.createFractalPatterns();
    this.createMist();
    this.createCircuitDome();
  }
  
  /**
   * Initialize map configuration
   */
  initializeMapConfig() {
    this.mapConfig = getMapConfig('QuantumIsland');
    console.log(
      `[MAP INIT] ${this.mapConfig.mapId} | theme: ${this.mapConfig.theme} | referencePlane: ${this.mapConfig.referencePlane}`
    );
  }
  
  /**
   * Initialize reference plane from map config
   * Session 112+: Universal system for all maps
   */
  initializeReferencePlane() {
    try {
      this.referencePlane = initMapReferencePlane(
        this.scene,
        this.camera,
        this.mapConfig.referencePlane
      );
      
      console.log(
        `[REFERENCE PLANE] ${this.mapConfig.referencePlane} initialized for ${this.mapConfig.mapId}`
      );
    } catch (err) {
      console.warn(
        `[REFERENCE PLANE] Failed to initialize ${this.mapConfig.referencePlane}:`,
        err
      );
      this.referencePlane = null;
    }
  }
  
  /**
   * Create the main island platform
   */
  createIsland() {
    // Main island body - smooth black stone
    const islandGeometry = new THREE.CylinderGeometry(20, 18, 3, 32, 1, false);
    
    // Deform top for more organic but still geometric look
    const positions = islandGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      if (y > 0) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const dist = Math.sqrt(x * x + z * z);
        const distortion = Math.sin(dist * 0.3) * 0.5;
        positions.setY(i, y + distortion);
      }
    }
    islandGeometry.computeVertexNormals();
    
    const islandMaterial = materialRegistry.getStandard('world.quantumisland.island', {
      color: 0x0a0a0a,
      roughness: 0.3,
      metalness: 0.8
    });
    
    this.island = new THREE.Mesh(islandGeometry, islandMaterial);
    this.island.position.y = 0;
    this.worldRoot.add(this.island);
    
    // Neon edge highlights
    const edgeCount = 32;
    for (let i = 0; i < edgeCount; i++) {
      const angle = (i / edgeCount) * Math.PI * 2;
      const radius = 19.5;
      
      const edgeGeometry = new THREE.BoxGeometry(0.8, 0.15, 0.15);
      const edgeMaterial = materialRegistry.getBasic('world.quantumisland.edgeAccent', {
        color: 0x00dddd,
        transparent: true,
        opacity: 0.6
      });
      
      const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
      edge.position.x = Math.cos(angle) * radius;
      edge.position.z = Math.sin(angle) * radius;
      edge.position.y = 1.5;
      edge.rotation.y = angle;
      
      edge.userData = {
        pulseOffset: i * 0.2
      };
      
      this.island.add(edge);
    }
    
    // Geometric cracks with glowing energy
    this.createEnergyCracks();
  }
  
  /**
   * Create glowing energy cracks in the island
   */
  createEnergyCracks() {
    const crackCount = 8;
    
    for (let i = 0; i < crackCount; i++) {
      const angle = (i / crackCount) * Math.PI * 2 + Math.random() * 0.5;
      const startRadius = 3 + Math.random() * 5;
      const endRadius = 15 + Math.random() * 4;
      
      const points = [];
      const segments = 8;
      
      for (let j = 0; j < segments; j++) {
        const t = j / (segments - 1);
        const radius = startRadius + (endRadius - startRadius) * t;
        const angleOffset = Math.sin(t * Math.PI) * 0.3;
        
        points.push(new THREE.Vector3(
          Math.cos(angle + angleOffset) * radius,
          1.51,
          Math.sin(angle + angleOffset) * radius
        ));
      }
      
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.12, 8, false);
      const tubeMaterial = materialRegistry.getBasic('world.quantumisland.vortexTube', {
        color: 0x00ddcc,
        emissive: 0x00ddcc,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.7
      });
      
      const crack = new THREE.Mesh(tubeGeometry, tubeMaterial);
      crack.userData = {
        pulseOffset: Math.random() * Math.PI * 2
      };
      
      this.island.add(crack);
    }
  }
  
  /**
   * Create swirling vortex void beneath island
   */
  createVortexVoid() {
    // Multiple layered rings creating vortex effect
    this.vortexRings = [];
    const ringCount = 12;
    
    for (let i = 0; i < ringCount; i++) {
      const radius = 30 + i * 8;
      const yPos = -10 - i * 3;
      
      const ringGeometry = new THREE.TorusGeometry(radius, 0.5, 8, 64);
      
      // Gradient color violet to turquoise
      const colorMix = i / ringCount;
      const color = new THREE.Color(0x8800ff).lerp(new THREE.Color(0x00dddd), colorMix);
      
      const ringMaterial = materialRegistry.getBasic('world.quantumisland.vortexRing', {
        color: color,
        transparent: true,
        opacity: 0.3 - (i / ringCount) * 0.2,
        side: THREE.DoubleSide
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.y = yPos;
      ring.rotation.x = Math.PI / 2;
      
      ring.userData = {
        rotationSpeed: 0.05 + (i * 0.005),
        originalRadius: radius
      };
      
      this.worldRoot.add(ring);
      this.vortexRings.push(ring);
    }
    
    // Add central swirl effect
    const swirlCount = 6;
    this.swirlArms = [];
    
    for (let i = 0; i < swirlCount; i++) {
      const angle = (i / swirlCount) * Math.PI * 2;
      const points = [];
      const segments = 30;
      
      for (let j = 0; j < segments; j++) {
        const t = j / segments;
        const radius = t * 40;
        const spiralAngle = angle + t * Math.PI * 3;
        const yPos = -10 - t * 25;
        
        points.push(new THREE.Vector3(
          Math.cos(spiralAngle) * radius,
          yPos,
          Math.sin(spiralAngle) * radius
        ));
      }
      
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 60, 0.3, 8, false);
      
      const color = i % 2 === 0 ? 0x8800ff : 0x00dddd;
      const tubeMaterial = materialRegistry.getBasic('world.quantumisland.filament', {
        color: color,
        transparent: true,
        opacity: 0.25,
        emissive: color,
        emissiveIntensity: 0.3
      });
      
      const swirl = new THREE.Mesh(tubeGeometry, tubeMaterial);
      swirl.userData = {
        rotationSpeed: 0.03
      };
      
      this.worldRoot.add(swirl);
      this.swirlArms.push(swirl);
    }
  }
  
  /**
   * Create rocks orbiting the island
   */
  createOrbitingRocks() {
    const rockCount = 8;
    
    const geometries = [
      new THREE.OctahedronGeometry(1.5),
      new THREE.TetrahedronGeometry(1.8),
      new THREE.IcosahedronGeometry(1.3),
      new THREE.DodecahedronGeometry(1.4)
    ];
    
    for (let i = 0; i < rockCount; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = materialRegistry.getStandard('world.quantumisland.rock', {
        color: 0x1a1a1a,
        roughness: 0.4,
        metalness: 0.7,
        emissive: 0x004444,
        emissiveIntensity: 0.2
      });
      
      const rock = new THREE.Mesh(geometry, material);
      
      const orbitRadius = 25 + Math.random() * 10;
      const orbitHeight = 3 + Math.random() * 8;
      const orbitAngle = (i / rockCount) * Math.PI * 2;
      
      rock.position.x = Math.cos(orbitAngle) * orbitRadius;
      rock.position.y = orbitHeight;
      rock.position.z = Math.sin(orbitAngle) * orbitRadius;
      
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      rock.userData = {
        orbitRadius: orbitRadius,
        orbitHeight: orbitHeight,
        orbitSpeed: 0.1 + Math.random() * 0.05,
        orbitAngle: orbitAngle,
        rotationSpeed: 0.2 + Math.random() * 0.3
      };
      
      this.worldRoot.add(rock);
      this.orbitingRocks.push(rock);
    }
  }
  
  /**
   * Create thin filaments connecting island to void
   */
  createFilaments() {
    const filamentCount = 12;
    
    for (let i = 0; i < filamentCount; i++) {
      const angle = (i / filamentCount) * Math.PI * 2;
      const startRadius = 15 + Math.random() * 4;
      
      const points = [
        new THREE.Vector3(
          Math.cos(angle) * startRadius,
          0,
          Math.sin(angle) * startRadius
        ),
        new THREE.Vector3(
          Math.cos(angle) * (startRadius + 10),
          -5 - Math.random() * 5,
          Math.sin(angle) * (startRadius + 10)
        ),
        new THREE.Vector3(
          Math.cos(angle) * (startRadius + 20),
          -15 - Math.random() * 10,
          Math.sin(angle) * (startRadius + 20)
        )
      ];
      
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.05, 8, false);
      const tubeMaterial = materialRegistry.getBasic('world.quantumisland.filamentThin', {
        color: 0x00dddd,
        transparent: true,
        opacity: 0.2,
        emissive: 0x00dddd,
        emissiveIntensity: 0.2
      });
      
      const filament = new THREE.Mesh(tubeGeometry, tubeMaterial);
      filament.userData = {
        pulseOffset: Math.random() * Math.PI * 2
      };
      
      this.worldRoot.add(filament);
      this.filaments.push(filament);
    }
  }
  
  /**
   * Create distant floating shards
   */
  createFloatingShards() {
    const shardCount = 20;
    
    for (let i = 0; i < shardCount; i++) {
      const geometry = new THREE.BoxGeometry(
        2 + Math.random() * 3,
        0.2,
        1 + Math.random() * 2
      );
      
      const material = materialRegistry.getStandard('world.quantumisland.shard', {
        color: 0x2a2a3a,
        transparent: true,
        opacity: 0.4,
        metalness: 0.8,
        roughness: 0.3,
        emissive: 0x003355,
        emissiveIntensity: 0.1
      });
      
      const shard = new THREE.Mesh(geometry, material);
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 40;
      
      shard.position.x = Math.cos(angle) * distance;
      shard.position.y = -5 + Math.random() * 20;
      shard.position.z = Math.sin(angle) * distance;
      
      shard.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      shard.userData = {
        floatSpeed: 0.1 + Math.random() * 0.1,
        floatOffset: Math.random() * Math.PI * 2,
        rotationSpeed: 0.05 + Math.random() * 0.05,
        originalY: shard.position.y
      };
      
      this.worldRoot.add(shard);
      this.floatingShards.push(shard);
    }
  }
  
  /**
   * Create quantum particles in slow spirals
   */
  createQuantumParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const velocities = [];
    
    const particleCount = 300;
    
    const color1 = new THREE.Color(0x8800ff);
    const color2 = new THREE.Color(0x00dddd);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 50;
      const height = Math.random() * 30 - 10;
      
      positions.push(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      
      const color = color1.clone().lerp(color2, Math.random());
      colors.push(color.r, color.g, color.b);
      
      // Spiral velocity
      const spiralSpeed = 0.1;
      velocities.push(
        -Math.sin(angle) * spiralSpeed,
        Math.random() * 0.05 - 0.02,
        Math.cos(angle) * spiralSpeed
      );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    this.quantumParticles = new THREE.Points(geometry, material);
    this.quantumParticles.userData.velocities = velocities;
    this.worldRoot.add(this.quantumParticles);
  }
  
  /**
   * Create glitch ribbons along horizon
   */
  createGlitchRibbons() {
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const distance = 60;
      
      const geometry = new THREE.PlaneGeometry(20, 8, 10, 5);
      const material = materialRegistry.getBasic('world.quantumisland.glitchRibbon', {
        color: 0x00ffff,
        transparent: true,
        opacity: 0,
        wireframe: true,
        side: THREE.DoubleSide
      });
      
      const ribbon = new THREE.Mesh(geometry, material);
      ribbon.position.x = Math.cos(angle) * distance;
      ribbon.position.y = 5;
      ribbon.position.z = Math.sin(angle) * distance;
      ribbon.lookAt(0, 5, 0);
      
      ribbon.userData = {
        glitchTimer: Math.random() * 8,
        glitchDuration: 0
      };
      
      this.worldRoot.add(ribbon);
      this.glitchRibbons.push(ribbon);
    }
  }
  
  /**
   * Create fractal patterns that appear and dissolve
   */
  createFractalPatterns() {
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.IcosahedronGeometry(3, 1);
      const material = materialRegistry.getBasic('world.quantumisland.fractalPattern', {
        color: 0x00dddd,
        transparent: true,
        opacity: 0,
        wireframe: true
      });
      
      const pattern = new THREE.Mesh(geometry, material);
      pattern.position.y = 8 + i * 3;
      
      pattern.userData = {
        timer: Math.random() * 15,
        duration: 0,
        pulsePhase: 0
      };
      
      this.worldRoot.add(pattern);
      this.fractalPatterns.push(pattern);
    }
  }
  
  /**
   * Create low-density mist
   */
  createMist() {
    const mistGeometry = new THREE.PlaneGeometry(50, 50);
    const mistMaterial = materialRegistry.getBasic('world.quantumisland.mist', {
      color: 0x5533aa,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide
    });
    
    this.mist = new THREE.Mesh(mistGeometry, mistMaterial);
    this.mist.rotation.x = -Math.PI / 2;
    this.mist.position.y = 0.3;
    this.worldRoot.add(this.mist);
  }
  
  /**
   * Create circuit-like dome patterns
   */
  createCircuitDome() {
    this.circuitLines = [];
    const lineCount = 12;
    
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      const points = [];
      const segments = 20;
      
      for (let j = 0; j < segments; j++) {
        const t = j / segments;
        const arcAngle = t * Math.PI;
        const radius = 70;
        
        points.push(new THREE.Vector3(
          Math.cos(angle) * Math.sin(arcAngle) * radius,
          Math.cos(arcAngle) * 40 + 10,
          Math.sin(angle) * Math.sin(arcAngle) * radius
        ));
      }
      
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 40, 0.05, 8, false);
      const tubeMaterial = materialRegistry.getBasic('world.quantumisland.circuitDome', {
        color: 0x4466ff,
        transparent: true,
        opacity: 0.1
      });
      
      const line = new THREE.Mesh(tubeGeometry, tubeMaterial);
      line.userData = {
        pulseOffset: i * 0.5
      };
      
      this.worldRoot.add(line);
      this.circuitLines.push(line);
    }
  }
  
  /**
   * Update quantum island animations
   */
  update(deltaTime, time) {
    // Session 112+: Update reference plane
    if (this.referencePlane && this.referencePlane.animate) {
      this.referencePlane.animate(deltaTime, time);
    }
    
    // Island edge highlights pulse
    if (this.island) {
      this.island.children.forEach(edge => {
        if (edge.userData.pulseOffset !== undefined) {
          const pulse = Math.sin(time * 2 + edge.userData.pulseOffset);
          edge.material.opacity = 0.5 + pulse * 0.2;
        }
      });
    }
    
    // Vortex rings rotation
    this.vortexRings.forEach(ring => {
      ring.rotation.z += ring.userData.rotationSpeed * deltaTime;
      
      // Subtle breathing
      const breath = Math.sin(time * 0.5) * 0.05 + 1;
      ring.scale.set(breath, breath, 1);
    });
    
    // Swirl arms rotation
    this.swirlArms.forEach(swirl => {
      swirl.rotation.y += swirl.userData.rotationSpeed * deltaTime;
    });
    
    // Orbiting rocks
    this.orbitingRocks.forEach(rock => {
      const data = rock.userData;
      data.orbitAngle += data.orbitSpeed * deltaTime;
      
      rock.position.x = Math.cos(data.orbitAngle) * data.orbitRadius;
      rock.position.z = Math.sin(data.orbitAngle) * data.orbitRadius;
      
      rock.rotation.x += data.rotationSpeed * deltaTime;
      rock.rotation.y += data.rotationSpeed * deltaTime * 0.7;
    });
    
    // Filaments pulse
    this.filaments.forEach(filament => {
      const pulse = Math.sin(time * 1.5 + filament.userData.pulseOffset);
      filament.material.opacity = 0.15 + pulse * 0.1;
    });
    
    // Floating shards
    this.floatingShards.forEach(shard => {
      const data = shard.userData;
      
      shard.position.y = data.originalY + 
        Math.sin(time * data.floatSpeed + data.floatOffset) * 2;
      
      shard.rotation.x += data.rotationSpeed * deltaTime;
      shard.rotation.y += data.rotationSpeed * deltaTime * 1.5;
    });
    
    // Quantum particles spiral
    if (this.quantumParticles) {
      const positions = this.quantumParticles.geometry.attributes.position.array;
      const velocities = this.quantumParticles.userData.velocities;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * deltaTime * 5;
        positions[i + 1] += velocities[i + 1] * deltaTime * 5;
        positions[i + 2] += velocities[i + 2] * deltaTime * 5;
        
        // Spiral inward/outward
        const x = positions[i];
        const z = positions[i + 2];
        const dist = Math.sqrt(x * x + z * z);
        
        if (dist > 60 || dist < 5) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 20 + Math.random() * 30;
          positions[i] = Math.cos(angle) * radius;
          positions[i + 1] = Math.random() * 30 - 10;
          positions[i + 2] = Math.sin(angle) * radius;
        }
      }
      
      this.quantumParticles.geometry.attributes.position.needsUpdate = true;
      this.quantumParticles.rotation.y += deltaTime * 0.1;
    }
    
    // Glitch ribbons
    this.glitchRibbons.forEach(ribbon => {
      ribbon.userData.glitchTimer -= deltaTime;
      
      if (ribbon.userData.glitchTimer <= 0 && ribbon.userData.glitchDuration <= 0) {
        ribbon.userData.glitchDuration = 0.15 + Math.random() * 0.25;
        ribbon.userData.glitchTimer = 4 + Math.random() * 8;
      }
      
      if (ribbon.userData.glitchDuration > 0) {
        ribbon.userData.glitchDuration -= deltaTime;
        ribbon.material.opacity = 0.15 + Math.random() * 0.15;
        
        // Distort
        const positions = ribbon.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          if (Math.random() > 0.6) {
            const offset = (Math.random() - 0.5) * 3;
            positions.setY(i, positions.getY(i) + offset);
          }
        }
        positions.needsUpdate = true;
      } else {
        ribbon.material.opacity = 0;
      }
    });
    
    // Fractal patterns
    this.fractalPatterns.forEach(pattern => {
      pattern.userData.timer -= deltaTime;
      
      if (pattern.userData.timer <= 0 && pattern.userData.duration <= 0) {
        pattern.userData.duration = 3 + Math.random() * 2;
        pattern.userData.timer = 10 + Math.random() * 10;
        pattern.userData.pulsePhase = 0;
      }
      
      if (pattern.userData.duration > 0) {
        pattern.userData.duration -= deltaTime;
        pattern.userData.pulsePhase += deltaTime * 2;
        
        const fadeIn = Math.min(pattern.userData.pulsePhase, 1);
        const fadeOut = Math.max(0, pattern.userData.duration);
        const opacity = Math.min(fadeIn, fadeOut) * 0.3;
        
        pattern.material.opacity = opacity;
        pattern.rotation.x += deltaTime * 0.5;
        pattern.rotation.y += deltaTime * 0.3;
        
        const scale = 1 + Math.sin(pattern.userData.pulsePhase * 2) * 0.2;
        pattern.scale.setScalar(scale);
      } else {
        pattern.material.opacity = 0;
      }
    });
    
    // Mist subtle wave
    if (this.mist) {
      this.mist.material.opacity = 0.08 + Math.sin(time * 0.3) * 0.02;
    }
    
    // Circuit lines pulse
    this.circuitLines.forEach(line => {
      const pulse = Math.sin(time + line.userData.pulseOffset);
      line.material.opacity = 0.08 + pulse * 0.04;
    });
  }
}
