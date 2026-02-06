import * as THREE from 'three';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';
import { initMapReferencePlane } from './MapReferencePlaneFactory.js';
import { getMapConfig } from './MapConfigBase.js';

/**
 * Fractal Valley - Recursive mathematical structures
 * Represents AI visualization of pattern formation and logic
 */
export class FractalValley {
  constructor(scene, camera = null) {
    this.scene = scene;
    this.camera = camera;
    this.mountains = [];
    this.fractalFragments = [];
    this.dataRivers = [];
    this.holograms = [];
    this.symbols = [];
    
    // Session 112+: Initialize map configuration and reference plane
    this.initializeMapConfig();
    this.initializeReferencePlane();
    
    // World FX Policy: gate decorative world FX
    this.enableDecorativeWorldFX = this.mapConfig.enableDecorativeWorldFX !== false;
    
    // World Time Modulation Policy: gate time-driven world visual animation
    this.allowWorldTimeModulation = this.mapConfig.allowWorldTimeModulation !== false;
    
    this.createValleyFloor();
    this.createFractalMountains();
    this.createFloatingFragments();
    this.createDataRivers();
    this.createMist();
    
    // World FX Policy: gate decorative world FX creation
    if (this.enableDecorativeWorldFX) {
      this.createParticleDrift();
      this.createFractalHolograms();
      this.createFloatingSymbols();
      this.createGeometricConstellations();
      this.createDistortionWaves();
    }
  }
  
  /**
   * Initialize map configuration
   */
  initializeMapConfig() {
    this.mapConfig = getMapConfig('FractalValley');
    console.log(
      `[MAP INIT] ${this.mapConfig.mapId} | theme: ${this.mapConfig.theme} | referencePlane: ${this.mapConfig.referencePlane}`
    );
  }
  
  /**
   * Initialize reference plane from map config
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
   * Create smooth valley floor with terraced patterns
   */
  createValleyFloor() {
    // Main floor
    const floorSize = 300;
    const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize, 60, 60);
    
    // Apply subtle wave pattern
    const positions = floorGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      
      // Fractal wave pattern
      const wave1 = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.5;
      const wave2 = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.8;
      const wave3 = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.4;
      
      positions.setZ(i, wave1 + wave2 + wave3);
    }
    
    floorGeometry.computeVertexNormals();
    
    const floorMaterial = materialRegistry.getStandard('world.fractalvalley.floor', {
      color: 0xd4c8f0,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: false
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    this.scene.add(floor);
    
    // Hexagonal terrace pattern on floor
    this.createHexTerraces();
  }
  
  /**
   * Create hexagonal terraces
   */
  createHexTerraces() {
    const hexRadius = 8;
    const hexCount = 15;
    
    for (let i = 0; i < hexCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 60;
      
      const hexGeometry = new THREE.CylinderGeometry(hexRadius, hexRadius, 0.3, 6);
      const hexMaterial = materialRegistry.getStandard('world.fractalvalley.hex', {
        color: 0xe0d4ff,
        roughness: 0.7,
        metalness: 0.3
      });
      
      const hex = new THREE.Mesh(hexGeometry, hexMaterial);
      hex.position.x = Math.cos(angle) * distance;
      hex.position.z = Math.sin(angle) * distance;
      hex.position.y = -1.5;
      hex.rotation.y = Math.random() * Math.PI;
      
      this.scene.add(hex);
      
      // Neon outline
      const edgeGeometry = new THREE.EdgesGeometry(hexGeometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x00dddd,
        transparent: true,
        opacity: 0.4
      });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      hex.add(edges);
    }
  }
  
  /**
   * Create fractal mountain ranges
   */
  createFractalMountains() {
    // Create multiple mountain ranges with self-similar patterns
    this.createMountainRange(-80, 0, 6, 'triangular');
    this.createMountainRange(80, 0, 5, 'hexagonal');
    this.createMountainRange(0, -80, 5, 'wave');
    this.createMountainRange(0, 80, 6, 'triangular');
  }
  
  /**
   * Create a mountain range with fractal patterns
   */
  createMountainRange(offsetX, offsetZ, count, pattern) {
    for (let i = 0; i < count; i++) {
      const scale = 1 - (i * 0.15); // Self-similar shrinking
      const mountainHeight = 25 * scale;
      const mountainWidth = 20 * scale;
      
      let geometry;
      
      if (pattern === 'triangular') {
        geometry = this.createTriangularMountain(mountainWidth, mountainHeight);
      } else if (pattern === 'hexagonal') {
        geometry = this.createHexagonalMountain(mountainWidth, mountainHeight);
      } else {
        geometry = this.createWaveMountain(mountainWidth, mountainHeight);
      }
      
      const material = materialRegistry.getStandard('world.fractalvalley.mountain', {
        color: this.getMountainColor(),
        roughness: 0.6,
        metalness: 0.4,
        flatShading: false
      });
      
      const mountain = new THREE.Mesh(geometry, material);
      
      // Position in line, receding into distance
      const spacing = mountainWidth * 1.8;
      const perpAngle = Math.atan2(offsetZ, offsetX) + Math.PI / 2;
      
      mountain.position.x = offsetX + Math.cos(perpAngle) * spacing * (i - count/2);
      mountain.position.z = offsetZ + Math.sin(perpAngle) * spacing * (i - count/2);
      mountain.position.y = -2;
      
      mountain.userData = {
        breathSpeed: 0.05 + Math.random() * 0.03,
        breathOffset: Math.random() * Math.PI * 2
      };
      
      this.scene.add(mountain);
      this.mountains.push(mountain);
      
      // Add neon edge outlines
      this.addNeonOutline(mountain, geometry);
    }
  }
  
  /**
   * Create triangular fractal mountain
   */
  createTriangularMountain(width, height) {
    const geometry = new THREE.ConeGeometry(width, height, 3, 6, false);
    
    // Add fractal detail to vertices
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      if (y > 0 && height > 0) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const dist = Math.sqrt(x * x + z * z);
        const fractalDetail = Math.sin(dist * 2) * (y / height) * 2;
        const newY = y + fractalDetail;
        
        // Check for valid value
        if (isFinite(newY)) {
          positions.setY(i, newY);
        }
      }
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }
  
  /**
   * Create hexagonal fractal mountain
   */
  createHexagonalMountain(width, height) {
    const geometry = new THREE.CylinderGeometry(0, width, height, 6, 8, false);
    
    // Add stepped terraces
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      if (y > -height/2 && height > 0) {
        const normalizedY = (y + height/2) / height;
        const steps = 6;
        const stepped = Math.floor(normalizedY * steps) / steps;
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const scale = 1 - stepped;
        const scaleFactor = 0.3 + scale * 0.7;
        
        const newX = x * scaleFactor;
        const newZ = z * scaleFactor;
        
        // Check for valid values
        if (isFinite(newX) && isFinite(newZ)) {
          positions.setX(i, newX);
          positions.setZ(i, newZ);
        }
      }
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }
  
  /**
   * Create wave-pattern mountain
   */
  createWaveMountain(width, height) {
    const geometry = new THREE.CylinderGeometry(
      width * 0.2,
      width,
      height,
      32,
      10,
      false
    );
    
    // Apply wave distortion
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      const angle = Math.atan2(z, x);
      const wave = Math.sin(angle * 6) * (y / height + 0.5) * 3;
      
      const dist = Math.sqrt(x * x + z * z);
      
      // Prevent division by zero
      if (dist > 0.001) {
        const scale = (dist + wave) / dist;
        const newX = x * scale;
        const newZ = z * scale;
        
        // Check for valid values
        if (isFinite(newX) && isFinite(newZ)) {
          positions.setX(i, newX);
          positions.setZ(i, newZ);
        }
      }
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }
  
  /**
   * Get mountain color (pastel variations)
   */
  getMountainColor() {
    const colors = [
      0xd4c8f0,  // Soft violet
      0xc8e0f0,  // Soft cyan
      0xd4f0e8,  // Soft teal
      0xe0d4f0   // Soft lavender
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Add neon outline to geometry
   */
  addNeonOutline(mesh, geometry) {
    const edgeGeometry = new THREE.EdgesGeometry(geometry, 30);
    const colors = [0x8800ff, 0x00dddd, 0x00ccaa];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5
    });
    
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.userData = { pulseOffset: Math.random() * Math.PI * 2 };
    mesh.add(edges);
  }
  
  /**
   * Create floating fractal fragments
   */
  createFloatingFragments() {
    const fragmentCount = 12;
    
    for (let i = 0; i < fragmentCount; i++) {
      const size = 2 + Math.random() * 3;
      const iterations = 1 + Math.floor(Math.random() * 2);
      
      const geometry = new THREE.IcosahedronGeometry(size, iterations);
      const material = materialRegistry.getStandard('world.fractalvalley.fragment', {
        color: 0xccbbff,
        transparent: true,
        opacity: 0.4,
        wireframe: true,
        metalness: 0.7,
        roughness: 0.3
      });
      
      const fragment = new THREE.Mesh(geometry, material);
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 60;
      
      fragment.position.x = Math.cos(angle) * distance;
      fragment.position.y = 10 + Math.random() * 20;
      fragment.position.z = Math.sin(angle) * distance;
      
      fragment.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      fragment.userData = {
        floatSpeed: 0.15 + Math.random() * 0.1,
        floatOffset: Math.random() * Math.PI * 2,
        rotationSpeed: 0.1 + Math.random() * 0.1,
        originalY: fragment.position.y
      };
      
      this.scene.add(fragment);
      this.fractalFragments.push(fragment);
    }
  }
  
  /**
   * Create data rivers flowing through valley
   */
  createDataRivers() {
    const riverCount = 5;
    
    for (let i = 0; i < riverCount; i++) {
      const startAngle = Math.random() * Math.PI * 2;
      const points = [];
      const segments = 40;
      
      for (let j = 0; j < segments; j++) {
        const t = j / segments;
        const distance = t * 100 - 50;
        const wander = Math.sin(t * Math.PI * 4) * 20;
        
        points.push(new THREE.Vector3(
          Math.cos(startAngle) * distance + Math.sin(t * Math.PI * 2) * wander,
          -1.3,
          Math.sin(startAngle) * distance + Math.cos(t * Math.PI * 2) * wander
        ));
      }
      
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 80, 0.15, 8, false);
      
      const color = i % 2 === 0 ? 0x00dddd : 0x8800ff;
      const tubeMaterial = materialRegistry.getBasic('world.fractalvalley.dataRiver', {
        color: color,
        transparent: true,
        opacity: 0.3,
        emissive: color,
        emissiveIntensity: 0.4
      });
      
      const river = new THREE.Mesh(tubeGeometry, tubeMaterial);
      river.userData = {
        flowOffset: Math.random() * Math.PI * 2
      };
      
      this.scene.add(river);
      this.dataRivers.push(river);
    }
  }
  
  /**
   * Create valley mist
   */
  createMist() {
    const mistGeometry = new THREE.PlaneGeometry(200, 200);
    const mistMaterial = materialRegistry.getBasic('world.fractalvalley.mist', {
      color: 0xccbbff,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide
    });
    
    this.mist = new THREE.Mesh(mistGeometry, mistMaterial);
    this.mist.rotation.x = -Math.PI / 2;
    this.mist.position.y = -0.5;
    this.scene.add(this.mist);
  }
  
  /**
   * Create particle drift
   */
  createParticleDrift() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const velocities = [];
    
    const particleCount = 250;
    
    const color1 = new THREE.Color(0x8800ff);
    const color2 = new THREE.Color(0x00dddd);
    
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 150;
      const y = Math.random() * 40;
      const z = (Math.random() - 0.5) * 150;
      
      positions.push(x, y, z);
      
      const color = color1.clone().lerp(color2, Math.random());
      colors.push(color.r, color.g, color.b);
      
      velocities.push(
        (Math.random() - 0.5) * 0.1,
        Math.random() * 0.05,
        (Math.random() - 0.5) * 0.1
      );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.particles.userData.velocities = velocities;
    this.scene.add(this.particles);
  }
  
  /**
   * Create fractal holograms
   */
  createFractalHolograms() {
    for (let i = 0; i < 4; i++) {
      const geometry = new THREE.TetrahedronGeometry(4, 2);
      const material = materialRegistry.getBasic('world.fractalvalley.hologram', {
        color: 0x00dddd,
        transparent: true,
        opacity: 0,
        wireframe: true
      });
      
      const hologram = new THREE.Mesh(geometry, material);
      
      const angle = (i / 4) * Math.PI * 2;
      hologram.position.x = Math.cos(angle) * 40;
      hologram.position.y = 5;
      hologram.position.z = Math.sin(angle) * 40;
      
      hologram.userData = {
        timer: Math.random() * 12,
        duration: 0,
        pulsePhase: 0
      };
      
      this.scene.add(hologram);
      this.holograms.push(hologram);
    }
  }
  
  /**
   * Create floating symbols
   */
  createFloatingSymbols() {
    const symbolGeometries = [
      new THREE.TorusGeometry(2, 0.3, 8, 16),
      new THREE.OctahedronGeometry(2, 0),
      new THREE.RingGeometry(1.5, 2, 6)
    ];
    
    for (let i = 0; i < 6; i++) {
      const geometry = symbolGeometries[Math.floor(Math.random() * symbolGeometries.length)];
      const material = materialRegistry.getBasic('world.fractalvalley.symbol', {
        color: 0xaa88ff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      
      const symbol = new THREE.Mesh(geometry, material);
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 25 + Math.random() * 40;
      
      symbol.position.x = Math.cos(angle) * distance;
      symbol.position.y = 8 + Math.random() * 12;
      symbol.position.z = Math.sin(angle) * distance;
      
      symbol.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      symbol.userData = {
        timer: Math.random() * 15,
        duration: 0,
        fadePhase: 0
      };
      
      this.scene.add(symbol);
      this.symbols.push(symbol);
    }
  }
  
  /**
   * Create geometric constellations in sky
   */
  createGeometricConstellations() {
    this.constellations = [];
    
    // Triangle grid constellation
    const trianglePoints = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const x = (i - 4) * 15;
        const z = (j - 4) * 15;
        trianglePoints.push(new THREE.Vector3(x, 50, z));
      }
    }
    
    this.createConstellation(trianglePoints, 0x6633ff);
    
    // Hex grid constellation
    const hexPoints = [];
    for (let ring = 0; ring < 3; ring++) {
      const count = ring === 0 ? 1 : ring * 6;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = ring * 20;
        hexPoints.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          55,
          Math.sin(angle) * radius - 60
        ));
      }
    }
    
    this.createConstellation(hexPoints, 0x00ccdd);
  }
  
  /**
   * Create constellation from points
   */
  createConstellation(points, color) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.3,
      transparent: true,
      opacity: 0.4
    });
    
    const constellation = new THREE.Points(geometry, material);
    constellation.userData = { pulseOffset: Math.random() * Math.PI * 2 };
    this.scene.add(constellation);
    this.constellations.push(constellation);
  }
  
  /**
   * Create distortion wave planes
   */
  createDistortionWaves() {
    this.distortionWaves = [];
    
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.PlaneGeometry(60, 30, 15, 10);
      const material = materialRegistry.getBasic('world.fractalvalley.distortionWave', {
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        wireframe: true,
        side: THREE.DoubleSide
      });
      
      const wave = new THREE.Mesh(geometry, material);
      wave.position.y = 15 + i * 8;
      
      wave.userData = {
        timer: Math.random() * 20,
        duration: 0,
        wavePhase: 0
      };
      
      this.scene.add(wave);
      this.distortionWaves.push(wave);
    }
  }
  
  /**
   * Update fractal valley animations
   */
  update(deltaTime, time) {
    // Update reference plane (canonical contract)
    if (this.referencePlane && this.referencePlane.animate) {
      this.referencePlane.animate(deltaTime, time);
    }
    
    // Mountains gentle breathing
    if (this.allowWorldTimeModulation) {
      this.mountains.forEach(mountain => {
        const data = mountain.userData;
        const breath = Math.sin(time * data.breathSpeed + data.breathOffset) * 0.15;
        mountain.scale.y = 1 + breath;
      });
    }
    
    // Pulse neon outlines
    if (this.allowWorldTimeModulation) {
      this.mountains.forEach(mountain => {
        mountain.children.forEach(child => {
          if (child.isLineSegments && child.userData.pulseOffset !== undefined) {
            const pulse = Math.sin(time * 2 + child.userData.pulseOffset);
            child.material.opacity = 0.4 + pulse * 0.2;
          }
        });
      });
    }
    
    // Floating fragments
    if (this.allowWorldTimeModulation) {
      this.fractalFragments.forEach(fragment => {
        const data = fragment.userData;
        
        fragment.position.y = data.originalY + 
          Math.sin(time * data.floatSpeed + data.floatOffset) * 3;
        
        fragment.rotation.x += data.rotationSpeed * deltaTime;
        fragment.rotation.y += data.rotationSpeed * deltaTime * 1.5;
      });
    }
    
    // Data rivers flow
    if (this.allowWorldTimeModulation) {
      this.dataRivers.forEach(river => {
        const pulse = Math.sin(time * 1.2 + river.userData.flowOffset);
        river.material.opacity = 0.25 + pulse * 0.1;
        river.material.emissiveIntensity = 0.3 + pulse * 0.2;
      });
    }
    
    // Mist wave
    if (this.allowWorldTimeModulation && this.mist) {
      this.mist.material.opacity = 0.06 + Math.sin(time * 0.3) * 0.02;
    }
    
    // World FX Policy: gate decorative FX updates
    // Particles drift
    if (this.enableDecorativeWorldFX && this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.userData.velocities;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * deltaTime * 10;
        positions[i + 1] += velocities[i + 1] * deltaTime * 10;
        positions[i + 2] += velocities[i + 2] * deltaTime * 10;
        
        if (positions[i + 1] > 45 || 
            Math.abs(positions[i]) > 80 || 
            Math.abs(positions[i + 2]) > 80) {
          positions[i] = (Math.random() - 0.5) * 150;
          positions[i + 1] = 0;
          positions[i + 2] = (Math.random() - 0.5) * 150;
        }
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Fractal holograms
    if (this.enableDecorativeWorldFX) {
      this.holograms.forEach(hologram => {
        hologram.userData.timer -= deltaTime;
        
        if (hologram.userData.timer <= 0 && hologram.userData.duration <= 0) {
          hologram.userData.duration = 4 + Math.random() * 3;
          hologram.userData.timer = 8 + Math.random() * 12;
          hologram.userData.pulsePhase = 0;
        }
        
        if (hologram.userData.duration > 0) {
          hologram.userData.duration -= deltaTime;
          hologram.userData.pulsePhase += deltaTime * 1.5;
          
          const fadeIn = Math.min(hologram.userData.pulsePhase, 1);
          const fadeOut = Math.max(0, hologram.userData.duration / 2);
          const opacity = Math.min(fadeIn, fadeOut) * 0.35;
          
          hologram.material.opacity = opacity;
          hologram.rotation.x += deltaTime * 0.4;
          hologram.rotation.y += deltaTime * 0.6;
        } else {
          hologram.material.opacity = 0;
        }
      });
    }
    
    // Floating symbols
    if (this.enableDecorativeWorldFX) {
      this.symbols.forEach(symbol => {
        symbol.userData.timer -= deltaTime;
        
        if (symbol.userData.timer <= 0 && symbol.userData.duration <= 0) {
          symbol.userData.duration = 3 + Math.random() * 2;
          symbol.userData.timer = 10 + Math.random() * 15;
          symbol.userData.fadePhase = 0;
        }
        
        if (symbol.userData.duration > 0) {
          symbol.userData.duration -= deltaTime;
          symbol.userData.fadePhase += deltaTime;
          
          const fadeIn = Math.min(symbol.userData.fadePhase, 1);
          const fadeOut = Math.max(0, symbol.userData.duration);
          const opacity = Math.min(fadeIn, fadeOut) * 0.25;
          
          symbol.material.opacity = opacity;
          symbol.rotation.x += deltaTime * 0.3;
          symbol.rotation.y += deltaTime * 0.2;
        } else {
          symbol.material.opacity = 0;
        }
      });
    }
    
    // Constellations twinkle
    if (this.enableDecorativeWorldFX && this.constellations) {
      this.constellations.forEach(constellation => {
        const pulse = Math.sin(time * 0.8 + constellation.userData.pulseOffset);
        constellation.material.opacity = 0.35 + pulse * 0.15;
      });
    }
    
    // Distortion waves
    if (this.enableDecorativeWorldFX) {
      this.distortionWaves.forEach(wave => {
        wave.userData.timer -= deltaTime;
        
        if (wave.userData.timer <= 0 && wave.userData.duration <= 0) {
          wave.userData.duration = 2 + Math.random() * 1.5;
          wave.userData.timer = 15 + Math.random() * 15;
          wave.userData.wavePhase = 0;
        }
        
        if (wave.userData.duration > 0) {
          wave.userData.duration -= deltaTime;
          wave.userData.wavePhase += deltaTime * 3;
          
          wave.material.opacity = Math.sin(wave.userData.wavePhase) * 0.08;
          
          // Wave distortion
          const positions = wave.geometry.attributes.position;
          for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const offset = Math.sin(x * 0.1 + wave.userData.wavePhase) * 2;
            positions.setZ(i, offset);
          }
          positions.needsUpdate = true;
        } else {
          wave.material.opacity = 0;
        }
      });
    }
  }
}
