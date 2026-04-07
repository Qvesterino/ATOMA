import * as THREE from 'three';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';
import { initMapReferencePlane } from './MapReferencePlaneFactory.js';
import { getMapConfig } from './MapConfigBase.js';

/**
 * Fractal Valley - Recursive mathematical structures
 * Represents AI visualization of pattern formation and logic
 */
export class FractalValley {
  constructor(scene, worldRoot, camera = null) {
    console.log('WORLD CONSTRUCTOR:', this.constructor.name);
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.camera = camera;
    this.mountains = [];
    this.hexTerraces = [];
    this.fractalFragments = [];
    this.fragmentGlowMaterial = null;
    this.fragmentLightningLines = [];
    this.dataRivers = [];
    this.holograms = [];
    this.symbols = [];
    this.collisionObjects = []; // Track collision meshes
    
    // Session 112+: Initialize map configuration and reference plane
    this.initializeMapConfig();
    this.initializeReferencePlane();
    this.createLighting();
    
    // World FX Policy: gate decorative world FX
    this.enableDecorativeWorldFX = this.mapConfig.enableDecorativeWorldFX !== false;
    
    // World Time Modulation Policy: gate time-driven world visual animation
    this.allowWorldTimeModulation = this.mapConfig.allowWorldTimeModulation !== false;
    
    this.createValleyFloor();
    this.createFractalMountains();
    this.createMountainSilhouetteGlow();
    this.createFloatingFragments();
    this.createDataRivers();
    this.createMist();
    this.createSkyDome();
    this.createVortexParticles();
    
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
        this.worldRoot,
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

  createLighting() {
    if (!this.scene) {
      return;
    }

    const hemiLight = new THREE.HemisphereLight(0x9988ff, 0x0a0520, 0.35);
    hemiLight.name = 'fractalValleyHemisphereLight';
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xddccff, 0.5);
    dirLight.position.set(40, 80, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -80;
    dirLight.shadow.camera.right = 80;
    dirLight.shadow.camera.top = 80;
    dirLight.shadow.camera.bottom = -80;
    dirLight.name = 'fractalValleyDirectionalLight';
    this.scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x00dddd, 0.3, 60);
    pointLight.position.set(0, 10, 0);
    pointLight.name = 'fractalValleyCenterPointLight';
    this.scene.add(pointLight);

    this.lights = { hemiLight, dirLight, pointLight };
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
    this.worldRoot.add(floor);
    
    // Create collision mesh for valley floor (invisible)
    const collisionMaterial = new THREE.MeshBasicMaterial({
      visible: false
    });
    const floorCollision = new THREE.Mesh(floorGeometry.clone(), collisionMaterial);
    floorCollision.rotation.x = -Math.PI / 2;
    floorCollision.position.copy(floor.position);
    floorCollision.userData = {
      isWalkable: true,
      collisionEnabled: true,
      terrainType: 'valleyFloor'
    };
    this.worldRoot.add(floorCollision);
    this.collisionObjects.push(floorCollision);
    
    // Hexagonal terrace pattern on floor
    this.createHexTerraces();
  }
  
  /**
   * Create hexagonal terraces
   */
  createHexTerraces() {
    const hexRadius = 8;
    const hexCount = 15;
    const collisionMaterial = new THREE.MeshBasicMaterial({
      visible: false
    });
    
    for (let i = 0; i < hexCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 60;
      
      const hexGeometry = new THREE.CylinderGeometry(hexRadius, hexRadius, 0.3, 6);
      const colors = new Float32Array(hexGeometry.attributes.position.count * 3);
      const innerColor = new THREE.Color(0xccddff);
      const outerColor = new THREE.Color(0x00dddd);
      for (let vi = 0; vi < hexGeometry.attributes.position.count; vi++) {
        const x = hexGeometry.attributes.position.getX(vi);
        const z = hexGeometry.attributes.position.getZ(vi);
        const dist = Math.sqrt(x * x + z * z);
        const t = Math.min(Math.max(dist / hexRadius, 0), 1);
        const color = innerColor.clone().lerp(outerColor, t);
        colors[vi * 3] = color.r;
        colors[vi * 3 + 1] = color.g;
        colors[vi * 3 + 2] = color.b;
      }
      hexGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const baseHexMaterial = materialRegistry.getStandard('world.fractalvalley.hex', {
        color: 0xe0d4ff,
        roughness: 0.7,
        metalness: 0.3,
        emissive: 0x00dddd,
        emissiveIntensity: 0.0
      });
      const hexMaterial = baseHexMaterial.clone();
      hexMaterial.vertexColors = true;
      
      const hex = new THREE.Mesh(hexGeometry, hexMaterial);
      hex.position.x = Math.cos(angle) * distance;
      hex.position.z = Math.sin(angle) * distance;
      hex.position.y = -1.5;
      hex.rotation.y = Math.random() * Math.PI;
      hex.userData = {
        pulseOffset: Math.random() * Math.PI * 2
      };
      
      this.worldRoot.add(hex);
      this.hexTerraces.push(hex);
      
      // Create collision mesh for hex terrace (invisible)
      const hexCollision = new THREE.Mesh(hexGeometry.clone(), collisionMaterial);
      hexCollision.position.copy(hex.position);
      hexCollision.rotation.copy(hex.rotation);
      hexCollision.userData = {
        isWalkable: true,
        collisionEnabled: true,
        terrainType: 'hexTerrace',
        height: 0.3
      };
      this.worldRoot.add(hexCollision);
      this.collisionObjects.push(hexCollision);
      
      // Neon outline
      const edgeGeometry = new THREE.EdgesGeometry(hexGeometry);
      const pos = edgeGeometry.attributes?.position?.array;
      if (pos) {
        for (let i = 0; i < pos.length; i++) {
          if (!Number.isFinite(pos[i])) {
            console.error('[GeometrySource] NaN created in EdgesGeometry', edgeGeometry);
            break;
          }
        }
      }
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
    const collisionMaterial = new THREE.MeshBasicMaterial({
      visible: false
    });
    
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
      
      this.worldRoot.add(mountain);
      this.mountains.push(mountain);
      
      // Create collision mesh for mountain (invisible)
      const mountainCollision = new THREE.Mesh(geometry.clone(), collisionMaterial);
      mountainCollision.position.copy(mountain.position);
      mountainCollision.rotation.copy(mountain.rotation);
      mountainCollision.userData = {
        isWalkable: true,
        collisionEnabled: true,
        terrainType: 'mountain',
        mountainType: pattern,
        height: mountainHeight
      };
      this.worldRoot.add(mountainCollision);
      this.collisionObjects.push(mountainCollision);
      
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
    const pos = edgeGeometry.attributes?.position?.array;
    if (pos) {
      for (let i = 0; i < pos.length; i++) {
        if (!Number.isFinite(pos[i])) {
          console.error('[GeometrySource] NaN created in EdgesGeometry', edgeGeometry);
          break;
        }
      }
    }
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
   * Create glowing silhouette particles along mountain ridges
   */
  createMountainSilhouetteGlow() {
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const baseHeights = new Float32Array(particleCount);
    const riseDistances = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const mountain = this.mountains[Math.floor(Math.random() * this.mountains.length)];
      const spread = 6 + Math.random() * 8;
      const baseX = mountain.position.x + (Math.random() * 2 - 1) * spread;
      const baseZ = mountain.position.z + (Math.random() * 2 - 1) * spread;
      const baseY = mountain.position.y + 6 + Math.random() * 6;

      positions[i * 3] = baseX;
      positions[i * 3 + 1] = baseY;
      positions[i * 3 + 2] = baseZ;

      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.533;
      colors[i * 3 + 2] = 1.0;

      alphas[i] = 1.0;
      speeds[i] = 0.12 + Math.random() * 0.08;
      baseHeights[i] = baseY;
      riseDistances[i] = 10 + Math.random() * 8;
    }

    const glowGeometry = new THREE.BufferGeometry();
    glowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    glowGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    glowGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: window.devicePixelRatio || 1 }
      },
      vertexShader: `
        attribute float aAlpha;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 40.0 * (uPixelRatio / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = length(uv);
          float mask = smoothstep(1.0, 0.4, dist);
          float alpha = clamp(mask * vAlpha, 0.0, 1.0);
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    const glowPoints = new THREE.Points(glowGeometry, glowMaterial);
    glowPoints.name = 'mountainSilhouetteGlow';
    glowPoints.renderOrder = 12;
    this.worldRoot.add(glowPoints);

    this.mountainSilhouetteGlow = glowPoints;
    this.mountainSilhouetteGlowData = {
      speeds,
      riseDistances,
      startYs: baseHeights,
      particleCount,
      spread: 8
    };
  }

  updateMountainSilhouetteGlow(deltaTime) {
    if (!this.mountainSilhouetteGlow || !this.mountainSilhouetteGlowData) {
      return;
    }

    const geometry = this.mountainSilhouetteGlow.geometry;
    const positions = geometry.attributes.position.array;
    const fades = geometry.attributes.aAlpha.array;
    const data = this.mountainSilhouetteGlowData;
    const mountains = this.mountains;

    for (let i = 0; i < data.particleCount; i++) {
      const idx = i * 3;
      const yIndex = idx + 1;
      positions[yIndex] += data.speeds[i] * deltaTime;

      const progress = (positions[yIndex] - data.startYs[i]) / data.riseDistances[i];
      fades[i] = 1.0 - progress;

      if (progress >= 1.0 || fades[i] <= 0.0) {
        const mountain = mountains[Math.floor(Math.random() * mountains.length)];
        const spread = data.spread + Math.random() * 4;
        const baseX = mountain.position.x + (Math.random() * 2 - 1) * spread;
        const baseZ = mountain.position.z + (Math.random() * 2 - 1) * spread;
        const baseY = mountain.position.y + 6 + Math.random() * 6;

        positions[idx] = baseX;
        positions[yIndex] = baseY;
        positions[idx + 2] = baseZ;
        data.startYs[i] = baseY;
        data.riseDistances[i] = 10 + Math.random() * 8;
        data.speeds[i] = 0.12 + Math.random() * 0.08;
        fades[i] = 1.0;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
  }
  
  /**
   * Create floating fractal fragments
   */
  createFragmentGlowMaterial() {
    if (this.fragmentGlowMaterial) {
      return this.fragmentGlowMaterial;
    }

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(
      size * 0.5,
      size * 0.5,
      0,
      size * 0.5,
      size * 0.5,
      size * 0.5
    );
    gradient.addColorStop(0, 'rgba(170,136,255,1)');
    gradient.addColorStop(0.4, 'rgba(170,136,255,0.4)');
    gradient.addColorStop(1, 'rgba(170,136,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    this.fragmentGlowMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: 0xaa88ff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    return this.fragmentGlowMaterial;
  }

  createFloatingFragments() {
    const fragmentCount = 12;
    const glowMaterial = this.createFragmentGlowMaterial();
    
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
      
      const glow = new THREE.Sprite(glowMaterial);
      glow.scale.set(size * 2, size * 2, 1);
      glow.position.set(0, 0, 0);
      fragment.add(glow);
      
      fragment.userData = {
        floatSpeed: 0.15 + Math.random() * 0.1,
        floatOffset: Math.random() * Math.PI * 2,
        rotationSpeed: 0.1 + Math.random() * 0.1,
        originalY: fragment.position.y,
        glowSprite: glow,
        size: size
      };
      
      this.worldRoot.add(fragment);
      this.fractalFragments.push(fragment);
    }
  }

  createFragmentLightningLine() {
    const segmentCount = 6;
    const lineGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array((segmentCount + 1) * 3);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });

    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.userData = {
      active: false,
      age: 0,
      flickerOffset: Math.random() * Math.PI * 2
    };
    this.worldRoot.add(line);
    return line;
  }

  updateFragmentLightning(deltaTime, time) {
    const maxDistance = 25;
    const maxDistanceSq = maxDistance * maxDistance;
    const fragmentCount = this.fractalFragments.length;
    const activeLines = [];

    for (let a = 0; a < fragmentCount; a++) {
      const fa = this.fractalFragments[a];
      for (let b = a + 1; b < fragmentCount; b++) {
        const fb = this.fractalFragments[b];
        const dx = fa.position.x - fb.position.x;
        const dz = fa.position.z - fb.position.z;
        const dy = fa.position.y - fb.position.y;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < maxDistanceSq) {
          activeLines.push({ a: fa, b: fb, dist: Math.sqrt(distSq) });
        }
      }
    }

    activeLines.sort((a, b) => a.dist - b.dist);
    const maxActive = 6;
    const lineCount = Math.min(activeLines.length, maxActive);

    while (this.fragmentLightningLines.length < lineCount) {
      this.fragmentLightningLines.push(this.createFragmentLightningLine());
    }

    for (let i = 0; i < lineCount; i++) {
      const line = this.fragmentLightningLines[i];
      const pair = activeLines[i];
      const material = line.material;
      const t = pair.dist / maxDistance;
      const flicker = Math.abs(Math.sin(time * 30 + line.userData.flickerOffset));
      material.opacity = (1.0 - t) * 0.55 * (0.4 + 0.6 * flicker);
      material.needsUpdate = true;

      const start = pair.a.position;
      const end = pair.b.position;
      const points = this.generateLightningPath(start, end, 5, time + i);
      const attr = line.geometry.attributes.position.array;
      for (let j = 0; j < points.length; j++) {
        attr[j * 3] = points[j].x;
        attr[j * 3 + 1] = points[j].y;
        attr[j * 3 + 2] = points[j].z;
      }
      line.geometry.attributes.position.needsUpdate = true;
      line.visible = true;
      line.userData.active = true;
    }

    for (let i = lineCount; i < this.fragmentLightningLines.length; i++) {
      const line = this.fragmentLightningLines[i];
      if (line.userData.active) {
        line.material.opacity = 0;
        line.visible = false;
        line.userData.active = false;
      }
    }
  }

  generateLightningPath(start, end, segments, seed) {
    const points = [];
    const startVec = new THREE.Vector3(start.x, start.y, start.z);
    const endVec = new THREE.Vector3(end.x, end.y, end.z);
    const dir = new THREE.Vector3().subVectors(endVec, startVec);
    const length = dir.length();
    const normal = new THREE.Vector3(0, 1, 0);
    const perp = new THREE.Vector3().crossVectors(dir, normal).normalize();
    if (perp.lengthSq() < 0.1) {
      perp.set(1, 0, 0);
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const base = new THREE.Vector3().lerpVectors(startVec, endVec, t);
      const offsetScale = Math.sin(Math.PI * t) * length * 0.08;
      const jitter = ((Math.sin(t * 12 + seed) + Math.random() * 0.8) - 0.4) * offsetScale;
      const offset = perp.clone().multiplyScalar(jitter);
      points.push(base.add(offset));
    }
    return points;
  }

  /**
   * Create data rivers flowing through valley
   */
  createDataRivers() {
    const riverCount = 5;
    const pointsPerRiver = 80;
    const totalPoints = riverCount * pointsPerRiver;
    const positions = new Float32Array(totalPoints * 3);
    const colors = new Float32Array(totalPoints * 3);
    const sizes = new Float32Array(totalPoints);
    const tValues = new Float32Array(totalPoints);
    const speeds = new Float32Array(totalPoints);
    const curveIndices = new Uint8Array(totalPoints);
    const curves = [];

    const minColor = new THREE.Color(0x8800ff);
    const maxColor = new THREE.Color(0x00dddd);

    let index = 0;
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

      curves.push(new THREE.CatmullRomCurve3(points));

      for (let j = 0; j < pointsPerRiver; j++) {
        const t = Math.random();
        const pos = curves[i].getPointAt(t);
        positions[index * 3] = pos.x;
        positions[index * 3 + 1] = pos.y;
        positions[index * 3 + 2] = pos.z;
        tValues[index] = t;
        speeds[index] = 0.06 + Math.random() * 0.06;
        curveIndices[index] = i;
        sizes[index] = 0.3 + Math.random() * 0.5;

        const color = minColor.clone().lerp(maxColor, t);
        colors[index * 3] = color.r;
        colors[index * 3 + 1] = color.g;
        colors[index * 3 + 2] = color.b;

        index += 1;
      }
    }

    const riverGeometry = new THREE.BufferGeometry();
    riverGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    riverGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    riverGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    riverGeometry.setAttribute('aT', new THREE.BufferAttribute(tValues, 1));
    riverGeometry.setAttribute('aCurve', new THREE.BufferAttribute(curveIndices, 1));

    const riverMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: window.devicePixelRatio || 1 }
      },
      vertexShader: `
        attribute float aSize;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        attribute float aT;
        void main() {
          vColor = color;
          vAlpha = smoothstep(0.0, 0.15, aT) * smoothstep(1.0, 0.8, aT);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (uPixelRatio / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = length(uv);
          float mask = smoothstep(1.0, 0.5, dist);
          float alpha = clamp((1.0 - dist) * vAlpha, 0.0, 1.0);
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    const riverPoints = new THREE.Points(riverGeometry, riverMaterial);
    riverPoints.name = 'dataRiverPoints';
    riverPoints.renderOrder = 10;
    this.worldRoot.add(riverPoints);
    this.dataRivers = [riverPoints];
    this.dataRiverData = {
      curves,
      tValues,
      speeds,
      curveIndices,
      positions,
      totalPoints,
      pointsPerRiver,
      trailLength: 0.1
    };
  }
  
  /**
   * Create valley mist
   */
  createMist() {
    if (this.scene) {
      this.scene.fog = new THREE.FogExp2(0x0a0520, 0.005);
    }

    const createLayer = (size, y, color, opacity) => {
      const geometry = new THREE.PlaneGeometry(size, size);
      const material = materialRegistry.getBasic('world.fractalvalley.mist', {
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const plane = new THREE.Mesh(geometry, material);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = y;
      this.worldRoot.add(plane);
      return plane;
    };

    this.mistLayers = [
      createLayer(200, -0.5, 0xccbbff, 0.06),
      createLayer(250, 5, 0x9988cc, 0.04),
      createLayer(300, 15, 0x6644aa, 0.02)
    ];
  }

  createSkyDome() {
    if (this.scene) {
      this.scene.background = new THREE.Color(0x050210);
    }

    const skyGeometry = new THREE.SphereGeometry(200, 32, 16);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTopColor: { value: new THREE.Color(0x0a0520) },
        uHorizonColor: { value: new THREE.Color(0x1a0a30) },
        uNebulaColor1: { value: new THREE.Color(0x8800ff) },
        uNebulaColor2: { value: new THREE.Color(0x00dddd) }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uTopColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uNebulaColor1;
        uniform vec3 uNebulaColor2;
        varying vec3 vWorldPosition;

        float softBlob(vec2 uv, vec2 center, float radius) {
          float d = length(uv - center);
          return smoothstep(radius, radius * 0.2, d);
        }

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float height = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 baseColor = mix(uHorizonColor, uTopColor, height);

          vec2 uv = dir.xz * 0.7;
          vec2 blob1 = uv + vec2(sin(uTime * 0.08) * 0.3, cos(uTime * 0.11) * 0.25);
          vec2 blob2 = uv + vec2(cos(uTime * 0.1) * 0.25, sin(uTime * 0.13) * 0.3);
          float n1 = softBlob(blob1, vec2(-0.2, 0.1), 0.7);
          float n2 = softBlob(blob2, vec2(0.3, -0.2), 0.6);
          float n3 = softBlob(uv, vec2(0.0, 0.3), 0.5);

          vec3 color = baseColor;
          color += uNebulaColor1 * n1 * 0.35;
          color += uNebulaColor2 * n2 * 0.25;
          color += mix(uNebulaColor1, uNebulaColor2, 0.5) * n3 * 0.15;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
      transparent: false
    });

    const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    skyDome.name = 'fractalSkyDome';
    this.worldRoot.add(skyDome);
    this.skyDomeMaterial = skyMaterial;
  }

  createVortexParticles() {
    const particleCount = 60;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const angles = new Float32Array(particleCount);
    const radii = new Float32Array(particleCount);
    const heights = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const rises = new Float32Array(particleCount);

    const colorLow = new THREE.Color(0x8800ff);
    const colorHigh = new THREE.Color(0x00dddd);

    const resetParticle = (index) => {
      const radius = 15 + Math.random() * 10;
      const angle = Math.random() * Math.PI * 2;
      const height = 1 + Math.random() * 4;
      const size = 0.4 + Math.random() * 0.6;
      const speed = 0.4 + Math.random() * 0.2;
      const rise = 0.12 + Math.random() * 0.08;

      angles[index] = angle;
      radii[index] = radius;
      heights[index] = height;
      speeds[index] = speed;
      rises[index] = rise;
      sizes[index] = size;
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = height;
      const t = Math.min(Math.max(y / 30, 0), 1);
      const color = colorLow.clone().lerp(colorHigh, t);

      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = z;
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    };

    for (let i = 0; i < particleCount; i++) {
      resetParticle(i);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: window.devicePixelRatio || 1 }
      },
      vertexShader: `
        attribute float aSize;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (uPixelRatio / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = length(uv);
          float alpha = smoothstep(1.0, 0.4, dist);
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    const vortex = new THREE.Points(geometry, material);
    vortex.name = 'vortexParticles';
    vortex.renderOrder = 11;
    this.worldRoot.add(vortex);

    this.vortexParticles = vortex;
    this.vortexData = {
      angles,
      radii,
      heights,
      speeds,
      rises,
      sizes,
      particleCount,
      resetParticle
    };
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
    this.worldRoot.add(this.particles);
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
        pulsePhase: 0,
        activeRing: null
      };
      
      this.worldRoot.add(hologram);
      this.holograms.push(hologram);
    }
  }
  
  createHologramPulseRing(hologram) {
    const geometry = new THREE.RingGeometry(0.1, 1, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00dddd,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(hologram.position);
    ring.scale.set(0.01, 0.01, 0.01);
    ring.userData = {
      age: 0,
      duration: 2
    };

    this.worldRoot.add(ring);
    return ring;
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
      
      this.worldRoot.add(symbol);
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
    this.worldRoot.add(constellation);

    const thresholdSq = 20 * 20;
    const linePositions = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dz = points[i].z - points[j].z;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < thresholdSq) {
          linePositions.push(points[i].x, points[i].y, points[i].z);
          linePositions.push(points[j].x, points[j].y, points[j].z);
        }
      }
    }

    const connectionGeometry = new THREE.BufferGeometry();
    connectionGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(linePositions), 3)
    );

    const lineMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const connections = new THREE.LineSegments(connectionGeometry, lineMaterial);
    connections.renderOrder = 9;
    this.worldRoot.add(connections);

    constellation.userData.connections = connections;
    this.constellations.push(constellation);
  }
  
  /**
   * Create distortion wave planes
   */
  createDistortionWaves() {
    this.distortionWaves = [];
    
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.PlaneGeometry(60, 30, 15, 10);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 }
        },
        vertexShader: `
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 modified = position;
            modified.z += sin(position.x * 0.1 + uTime * 3.0) * 2.0;
            vec4 mvPosition = modelViewMatrix * vec4(modified, 1.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            vec2 grid = abs(fract(vUv * 10.0 - 0.5) - 0.5) / fwidth(vUv * 10.0);
            float line = min(grid.x, grid.y);
            float alpha = smoothstep(0.35, 0.05, line) * uOpacity;
            if (alpha < 0.01) discard;
            gl_FragColor = vec4(vec3(0.78, 0.86, 1.0), alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      
      const wave = new THREE.Mesh(geometry, material);
      wave.position.y = 15 + i * 8;
      
      wave.userData = {
        timer: Math.random() * 20,
        duration: 0,
        wavePhase: 0
      };
      
      this.worldRoot.add(wave);
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

    // Hex terrace glow pulse
    if (this.allowWorldTimeModulation && this.hexTerraces) {
      this.hexTerraces.forEach(hex => {
        if (!hex.material) return;
        const pulse = Math.sin(time * 1.5 + hex.userData.pulseOffset);
        hex.material.emissiveIntensity = Math.max(0, 0.075 + pulse * 0.075);
      });
    }
    
    // Floating fragments
    if (this.allowWorldTimeModulation) {
      this.fractalFragments.forEach(fragment => {
        const data = fragment.userData;
        
        fragment.position.y = data.originalY + 
          Math.sin(time * data.floatSpeed + data.floatOffset) * 3;
        
        const glow = data.glowSprite;
        if (glow) {
          const pulse = 0.85 + 0.15 * Math.sin(time * data.floatSpeed + data.floatOffset);
          const glowScale = data.size * 2 * pulse;
          glow.scale.set(glowScale, glowScale, 1);
        }
        
        fragment.rotation.x += data.rotationSpeed * deltaTime;
        fragment.rotation.y += data.rotationSpeed * deltaTime * 1.5;
      });
    }

    if (this.allowWorldTimeModulation) {
      this.updateMountainSilhouetteGlow(deltaTime);
      this.updateFragmentLightning(deltaTime, time);
      if (this.skyDomeMaterial) {
        this.skyDomeMaterial.uniforms.uTime.value = time;
      }
    }
    
    // Data rivers flow
    if (this.allowWorldTimeModulation && this.dataRiverData) {
      const data = this.dataRiverData;
      const positions = data.positions;
      const colors = this.dataRivers[0].geometry.attributes.color.array;
      const tValues = data.tValues;
      const total = data.totalPoints;
      const trails = data.trailLength;

      for (let i = 0; i < total; i++) {
        tValues[i] += data.speeds[i] * deltaTime;
        if (tValues[i] > 1.0) tValues[i] -= 1.0;
        const curve = data.curves[data.curveIndices[i]];
        const point = curve.getPointAt(tValues[i]);
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;

        const color = new THREE.Color(0x8800ff).lerp(new THREE.Color(0x00dddd), tValues[i]);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      const geom = this.dataRivers[0].geometry;
      geom.attributes.position.needsUpdate = true;
      geom.attributes.color.needsUpdate = true;
      geom.attributes.aT.needsUpdate = true;
    }
    
    // Mist wave
    if (this.allowWorldTimeModulation && this.mistLayers) {
      this.mistLayers.forEach((layer, index) => {
        if (!layer || !layer.material) {
          return;
        }
        const baseOpacities = [0.06, 0.04, 0.02];
        const amplitudes = [0.02, 0.015, 0.01];
        const speeds = [0.3, 0.22, 0.16];
        const pulse = Math.sin(time * speeds[index] + index * 1.2);
        layer.material.opacity = baseOpacities[index] + pulse * amplitudes[index];
      });
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

    if (this.enableDecorativeWorldFX && this.vortexParticles && this.vortexData) {
      const positions = this.vortexParticles.geometry.attributes.position.array;
      const colors = this.vortexParticles.geometry.attributes.color.array;
      const sizes = this.vortexParticles.geometry.attributes.aSize.array;
      const data = this.vortexData;
      const colorLow = new THREE.Color(0x8800ff);
      const colorHigh = new THREE.Color(0x00dddd);

      for (let i = 0; i < data.particleCount; i++) {
        data.angles[i] += data.speeds[i] * deltaTime;
        data.radii[i] *= 0.999;
        data.heights[i] += data.rises[i] * deltaTime;

        if (data.heights[i] > 30 || data.radii[i] < 0.5) {
          data.resetParticle(i);
        }

        const angle = data.angles[i];
        const radius = data.radii[i];
        const height = data.heights[i];
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = height;
        const t = Math.min(Math.max(y / 30, 0), 1);
        const color = colorLow.clone().lerp(colorHigh, t);

        const idx = i * 3;
        positions[idx] = x;
        positions[idx + 1] = y;
        positions[idx + 2] = z;
        colors[idx] = color.r;
        colors[idx + 1] = color.g;
        colors[idx + 2] = color.b;
        sizes[i] = 0.4 + (1.0 - t) * 0.6;
      }

      this.vortexParticles.geometry.attributes.position.needsUpdate = true;
      this.vortexParticles.geometry.attributes.color.needsUpdate = true;
      this.vortexParticles.geometry.attributes.aSize.needsUpdate = true;
    }
    
    // Fractal holograms
    if (this.enableDecorativeWorldFX) {
      this.holograms.forEach(hologram => {
        hologram.userData.timer -= deltaTime;
        
        if (hologram.userData.timer <= 0 && hologram.userData.duration <= 0) {
          hologram.userData.duration = 4 + Math.random() * 3;
          hologram.userData.timer = 8 + Math.random() * 12;
          hologram.userData.pulsePhase = 0;
          if (!hologram.userData.activeRing) {
            hologram.userData.activeRing = this.createHologramPulseRing(hologram);
          }
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

        const ring = hologram.userData.activeRing;
        if (ring) {
          ring.userData.age += deltaTime;
          const progress = ring.userData.age / ring.userData.duration;
          const scale = Math.min(progress * 8, 8);
          ring.scale.set(scale, scale, scale);
          ring.material.opacity = Math.max(0, 0.35 * (1 - progress));

          if (ring.userData.age >= ring.userData.duration) {
            this.worldRoot.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
            hologram.userData.activeRing = null;
          }
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
        if (constellation.userData.connections) {
          constellation.userData.connections.material.opacity = 0.12 + pulse * 0.06;
        }
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
          
          if (wave.material && wave.material.uniforms) {
            wave.material.uniforms.uTime.value = time;
            wave.material.uniforms.uOpacity.value = Math.max(0, Math.sin(wave.userData.wavePhase) * 0.08);
          }
        } else {
          if (wave.material && wave.material.uniforms) {
            wave.material.uniforms.uOpacity.value = 0;
          }
        }
      });
    }
  }
}
