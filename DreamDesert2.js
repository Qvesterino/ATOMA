import * as THREE from 'three';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';
import { initMapReferencePlane } from './MapReferencePlaneFactory.js';
import { getMapConfig } from './MapConfigBase.js';

/**
 * Dream Desert 2.0 - Dream Realism Edition
 * High-fidelity ATOMA Dreamscape with realistic atmosphere
 * Synthetic geometric dunes with soft realistic lighting
 * Maintains surreal AI aesthetic through material design and color palette
 * Separate invisible collision layer for physics
 */
export class DreamDesert2 {
  constructor(scene, worldRoot, camera = null) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.camera = camera;
    this.visualObjects = [];
    this.collisionObjects = [];
    this.animatedObjects = [];
    this.particleSystems = [];
    this.renderer = null;
    
    // Session 112+: Initialize map configuration and reference plane
    this.initializeMapConfig();
    this.initializeReferencePlane();
    
    // Build environment with dream realism
    this.createSkyAndAtmosphere();
    this.createMainDunes();
    this.createFractalRidges();
    this.createFloatingFragments();
    this.createVolumetricEffects();
    this.createAdvancedLighting();
    this.createParticleSystems();
    this.createAtmosphericScattering();
    this.createCollisionLayer();
  }
  
  /**
   * Initialize map configuration
   */
  initializeMapConfig() {
    this.mapConfig = getMapConfig('DreamDesert2');
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
  
  /**
   * Setup sky, background, and atmospheric conditions
   */
  createSkyAndAtmosphere() {
    // World authority handled by pipeline; retain placeholders without overriding scene
  }
  
  /**
   * Create primary dune terrain with advanced fractal generation
   */
  createMainDunes() {
    // Ultra-high resolution for smooth curves
    const geometry = new THREE.PlaneGeometry(240, 240, 160, 160);
    
    const positionAttribute = geometry.getAttribute('position');
    const positions = positionAttribute.array;
    
    // Advanced multi-octave fractal generation
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const dist = Math.sqrt(x * x + z * z);
      
      let height = 0;
      
      // Primary flowing dunes - smooth, AI-synthetic curves
      height += Math.sin(x * 0.032) * Math.cos(z * 0.028) * 7.5;
      
      // Secondary wave layer - creates flowing ridges
      height += Math.sin(x * 0.095 + z * 0.072) * Math.cos(z * 0.095) * 2.8;
      
      // Tertiary fractal detail - subtle geometric patterns
      height += Math.sin(x * 0.22) * Math.cos(z * 0.22) * 1.2;
      
      // Micro-fractal shimmer - adds synthetic feel
      height += Math.sin(x * 0.48 + z * 0.35) * 0.4;
      
      // Soft edge falloff with distance
      const falloff = Math.max(0.15, Math.pow(1 - (dist * 0.0075), 1.5));
      height *= falloff;
      
      positions[i + 1] = Math.max(0, height);
    }
    
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Premium synthetic dune material with realistic shading
    const duneMaterial = materialRegistry.getStandard('world.dreamdesert2.duneMain', {
      color: 0xffc5d8,           // Soft pastel pink
      roughness: 0.55,           // Polished stone-like finish
      metalness: 0.06,           // Subtle holographic shimmer
      emissive: 0xffb8cc,        // Soft warm glow
      emissiveIntensity: 0.1,    // Gentle bloom
      side: THREE.DoubleSide,
      envMapIntensity: 1.2,      // Enhanced environment reflection
      clearcoat: 0.18,           // Polished surface sheen
      clearcoatRoughness: 0.7,   // Soft specular highlights
      sheen: 0.1,                // Fabric-like subsurface feel
      sheenRoughness: 0.5
    });
    
    const dunes = new THREE.Mesh(geometry, duneMaterial);
    dunes.rotation.x = -Math.PI / 2;
    dunes.castShadow = true;
    dunes.receiveShadow = true;
    dunes.name = 'mainDunes';
    
    this.worldRoot.add(dunes);
    this.visualObjects.push(dunes);
  }
  
  /**
   * Create geometric fractal ridge formations
   */
  createFractalRidges() {
    const ridgeCount = 7;
    
    for (let r = 0; r < ridgeCount; r++) {
      const angle = (r / ridgeCount) * Math.PI * 2;
      const distance = 40 + Math.random() * 50;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      const length = 18 + Math.random() * 22;
      const height = 2.5 + Math.random() * 3.5;
      
      // Create ridge geometry
      const ridgeGeo = new THREE.BoxGeometry(length, height, 0.9);
      
      // Gradient material transitioning through pastel spectrum
      const ridgeMaterial = materialRegistry.getStandard('world.dreamdesert2.ridge', {
        color: 0xffb5d0,
        roughness: 0.5,           // Smooth polished surface
        metalness: 0.1,           // Subtle metallic sheen
        emissive: 0xffa8c8,
        emissiveIntensity: 0.08,
        side: THREE.DoubleSide,
        clearcoat: 0.15,
        clearcoatRoughness: 0.7,
        envMapIntensity: 1.1
      });
      
      const ridge = new THREE.Mesh(ridgeGeo, ridgeMaterial);
      ridge.position.set(x, height * 0.5 + 0.3, z);
      ridge.rotation.y = Math.random() * Math.PI;
      ridge.rotation.z = (Math.random() - 0.5) * 0.12;
      ridge.castShadow = true;
      ridge.receiveShadow = true;
      ridge.name = 'fractalRidge';
      
      this.worldRoot.add(ridge);
      this.visualObjects.push(ridge);
    }
  }
  
  /**
   * Create floating micro-shards and fragments above dunes
   */
  createFloatingFragments() {
    const fragmentCount = 18;
    
    for (let f = 0; f < fragmentCount; f++) {
      const x = (Math.random() - 0.5) * 170;
      const z = (Math.random() - 0.5) * 170;
      const floatHeight = 3.5 + Math.random() * 9;
      const size = 0.22 + Math.random() * 0.55;
      
      // Create geometric fragment with varied geometries
      let fragGeometry;
      const geoType = Math.random();
      if (geoType < 0.4) {
        fragGeometry = new THREE.OctahedronGeometry(size, 1);
      } else if (geoType < 0.7) {
        fragGeometry = new THREE.IcosahedronGeometry(size, 1);
      } else {
        fragGeometry = new THREE.TetrahedronGeometry(size);
      }
      
      const fragMaterial = materialRegistry.getStandard('world.dreamdesert2.fragment', {
        color: 0xff88ff,           // Magenta holographic
        roughness: 0.2,            // Highly polished metal
        metalness: 0.88,           // Strong metallic reflection
        emissive: 0xff99ff,
        emissiveIntensity: 0.32,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        clearcoat: 0.25,           // Strong holographic sheen
        clearcoatRoughness: 0.6,
        envMapIntensity: 1.3       // Enhanced reflections
      });
      
      const fragment = new THREE.Mesh(fragGeometry, fragMaterial);
      fragment.position.set(x, floatHeight, z);
      fragment.castShadow = true;
      fragment.receiveShadow = true;
      fragment.name = 'floatingFragment';
      
      // Store animation data
      fragment.userData = {
        baseY: floatHeight,
        floatSpeed: 0.35 + Math.random() * 0.3,
        floatAmount: 0.6 + Math.random() * 0.4,
        floatOffset: Math.random() * Math.PI * 2,
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.004,
          y: (Math.random() - 0.5) * 0.005,
          z: (Math.random() - 0.5) * 0.003
        }
      };
      
      this.worldRoot.add(fragment);
      this.visualObjects.push(fragment);
      this.animatedObjects.push({
        object: fragment,
        type: 'floatFragment'
      });
    }
  }
  
  /**
   * Create advanced volumetric lighting effects
   */
  createVolumetricEffects() {
    // Volumetric god rays plane
    const rayGeometry = new THREE.PlaneGeometry(280, 280);
    
    // Create canvas texture for volumetric effect
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create multiple overlapping radial gradients for complex effect
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 300);
    gradient.addColorStop(0, 'rgba(255, 220, 230, 0.12)');
    gradient.addColorStop(0.3, 'rgba(255, 180, 210, 0.08)');
    gradient.addColorStop(0.7, 'rgba(255, 120, 180, 0.03)');
    gradient.addColorStop(1, 'rgba(255, 100, 180, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add subtle noise for shimmer
    const imageData = ctx.getImageData(0, 0, 512, 512);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 3;
      data[i] += noise;
      data[i + 1] += noise;
      data[i + 2] += noise;
    }
    ctx.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const rayMaterial = materialRegistry.getBasic('world.dreamdesert2.ray', {
      map: texture,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    
    const volumetric = new THREE.Mesh(rayGeometry, rayMaterial);
    volumetric.position.y = 28;
    volumetric.rotation.x = -Math.PI / 2;
    volumetric.name = 'volumetricRays';
    
    this.worldRoot.add(volumetric);
    
    this.animatedObjects.push({
      object: volumetric,
      type: 'volumetricRays',
      baseOpacity: 0.09,
      pulseSpeed: 0.4
    });
  }
  
  /**
   * Create advanced cinematic 6-light system with realistic soft shadows
   */
  createAdvancedLighting() {
    // Ambient light - warm, dreamlike base (global illumination base)
    const ambientLight = new THREE.AmbientLight(0xffc8d8, 0.45);
    this.worldRoot.add(ambientLight);
    
    // Main directional light - dream-artificial sun with soft shadows
    const sunLight = new THREE.DirectionalLight(0xffddcc, 0.72);
    sunLight.position.set(65, 65, 80);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;          // Higher resolution for soft shadows
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.left = -150;
    sunLight.shadow.camera.right = 150;
    sunLight.shadow.camera.top = 150;
    sunLight.shadow.camera.bottom = -150;
    sunLight.shadow.bias = -0.00075;
    sunLight.shadow.radius = 6;                    // Larger radius for softer shadows
    sunLight.shadow.normalBias = 0.02;
    sunLight.shadowMapSize = new THREE.Vector2(4096, 4096);
    this.worldRoot.add(sunLight);
    
    // Primary fill light - cyan, balances warmth and bounces light
    const fillLight = new THREE.DirectionalLight(0x88ffff, 0.38);
    fillLight.position.set(-90, 35, -90);
    fillLight.castShadow = true;
    fillLight.shadow.mapSize.width = 2048;
    fillLight.shadow.mapSize.height = 2048;
    fillLight.shadow.radius = 3;
    this.worldRoot.add(fillLight);
    
    // Rim light - magenta holographic accent for edge definition
    const rimLight = new THREE.DirectionalLight(0xff99ff, 0.28);
    rimLight.position.set(30, 52, -110);
    rimLight.castShadow = false;                  // Subtle, no shadow
    this.worldRoot.add(rimLight);
    
    // Bounce light - subtle violet from below for subsurface feel
    const bounceLight = new THREE.DirectionalLight(0xaa99ff, 0.22);
    bounceLight.position.set(-10, -30, 15);
    bounceLight.castShadow = false;
    this.worldRoot.add(bounceLight);
    
    // Secondary fill - subtle cyan from opposite side
    const secondaryFill = new THREE.DirectionalLight(0xccffff, 0.15);
    secondaryFill.position.set(100, 18, -70);
    secondaryFill.castShadow = false;
    this.worldRoot.add(secondaryFill);
    
    // Soft warm fill from ground for global illumination
    const groundFill = new THREE.DirectionalLight(0xffe8dd, 0.08);
    groundFill.position.set(0, -50, 0);
    this.worldRoot.add(groundFill);
  }
  
  /**
   * Create advanced particle systems
   */
  createParticleSystems() {
    // Primary drifting particles - very light, slow moving
    const particleCount = 220;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 220;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 220;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.011;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.008;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.011;
      
      scales[i] = 0.08 + Math.random() * 0.18;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffc8dd,
      size: 0.11,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.28,
      fog: true
    });
    
    const particles = new THREE.Points(geometry, particleMaterial);
    particles.name = 'dreamParticles';
    
    this.worldRoot.add(particles);
    this.particleSystems.push({
      object: particles,
      positions: positions,
      velocities: velocities,
      bounds: 120
    });
    
    this.animatedObjects.push({
      object: particles,
      type: 'particles'
    });
    
    // Secondary shimmer particles - holographic micro-glints
    const shimmerCount = 90;
    const shimmerGeo = new THREE.BufferGeometry();
    
    const shimmerPos = new Float32Array(shimmerCount * 3);
    const shimmerVel = new Float32Array(shimmerCount * 3);
    
    for (let i = 0; i < shimmerCount; i++) {
      shimmerPos[i * 3] = (Math.random() - 0.5) * 220;
      shimmerPos[i * 3 + 1] = 0.5 + Math.random() * 14;
      shimmerPos[i * 3 + 2] = (Math.random() - 0.5) * 220;
      
      shimmerVel[i * 3] = (Math.random() - 0.5) * 0.008;
      shimmerVel[i * 3 + 1] = (Math.random() - 0.5) * 0.006;
      shimmerVel[i * 3 + 2] = (Math.random() - 0.5) * 0.008;
    }
    
    shimmerGeo.setAttribute('position', new THREE.BufferAttribute(shimmerPos, 3));
    shimmerGeo.setAttribute('velocity', new THREE.BufferAttribute(shimmerVel, 3));
    
    const shimmerMaterial = new THREE.PointsMaterial({
      color: 0xffffcc,
      size: 0.07,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.22,
      fog: false
    });
    
    const shimmerParticles = new THREE.Points(shimmerGeo, shimmerMaterial);
    shimmerParticles.name = 'shimmerParticles';
    
    this.worldRoot.add(shimmerParticles);
    this.particleSystems.push({
      object: shimmerParticles,
      positions: shimmerPos,
      velocities: shimmerVel,
      bounds: 120
    });
    
    this.animatedObjects.push({
      object: shimmerParticles,
      type: 'shimmerParticles'
    });
  }
  
  /**
   * Create atmospheric scattering and light shafts for dream realism
   */
  createAtmosphericScattering() {
    // Create multiple volumetric layers for depth
    
    // Layer 1: Ground-hugging mist
    const mistGeo1 = new THREE.PlaneGeometry(280, 280);
    const mistMat1 = materialRegistry.getBasic('world.dreamdesert2.mist1', {
      color: 0xe8c0d0,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const mist1 = new THREE.Mesh(mistGeo1, mistMat1);
    mist1.position.y = 0.5;
    mist1.rotation.x = -Math.PI / 2;
    this.worldRoot.add(mist1);
    
    // Layer 2: Mid-height atmospheric haze
    const mistGeo2 = new THREE.PlaneGeometry(300, 300);
    const mistMat2 = materialRegistry.getBasic('world.dreamdesert2.mist2', {
      color: 0xf0d8e8,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const mist2 = new THREE.Mesh(mistGeo2, mistMat2);
    mist2.position.y = 15;
    mist2.rotation.x = -Math.PI / 2;
    this.worldRoot.add(mist2);
    
    // Layer 3: High-altitude glow
    const mistGeo3 = new THREE.PlaneGeometry(350, 350);
    const mistMat3 = materialRegistry.getBasic('world.dreamdesert2.mist3', {
      color: 0xffe8f0,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const mist3 = new THREE.Mesh(mistGeo3, mistMat3);
    mist3.position.y = 35;
    mist3.rotation.x = -Math.PI / 2;
    this.worldRoot.add(mist3);
    
    // Light shaft effect - moving godrays
    const rayGeo = new THREE.PlaneGeometry(200, 200);
    const rayMat = materialRegistry.getBasic('world.dreamdesert2.godray', {
      color: 0xffeedd,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const rays = new THREE.Mesh(rayGeo, rayMat);
    rays.position.set(30, 20, 40);
    rays.rotation.x = -0.3;
    this.worldRoot.add(rays);
    
    this.animatedObjects.push({
      object: rays,
      type: 'lightShafts',
      angle: 0
    });
  }
  
  /**
   * Create invisible collision layer
   */
  createCollisionLayer() {
    const invisibleMaterial = materialRegistry.getBasic('world.dreamdesert2.collision', {
      transparent: true,
      opacity: 0,
      wireframe: false
    });
    
    // Main terrain collision
    const collisionGeo = new THREE.PlaneGeometry(240, 240, 80, 80);
    
    const positionAttribute = collisionGeo.getAttribute('position');
    const positions = positionAttribute.array;
    
    // Match dune heights exactly
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const dist = Math.sqrt(x * x + z * z);
      
      let height = 0;
      height += Math.sin(x * 0.032) * Math.cos(z * 0.028) * 7.5;
      height += Math.sin(x * 0.095 + z * 0.072) * Math.cos(z * 0.095) * 2.8;
      height += Math.sin(x * 0.22) * Math.cos(z * 0.22) * 1.2;
      height += Math.sin(x * 0.48 + z * 0.35) * 0.4;
      
      const falloff = Math.max(0.15, Math.pow(1 - (dist * 0.0075), 1.5));
      height *= falloff;
      
      positions[i + 1] = Math.max(0, height);
    }
    
    positionAttribute.needsUpdate = true;
    collisionGeo.computeVertexNormals();
    
    const collisionTerrain = new THREE.Mesh(collisionGeo, invisibleMaterial);
    collisionTerrain.rotation.x = -Math.PI / 2;
    collisionTerrain.userData = {
      isWalkable: true,
      collisionEnabled: true,
      terrainType: 'mainDunes'
    };
    
    this.worldRoot.add(collisionTerrain);
    this.collisionObjects.push(collisionTerrain);
    
    // Collision for ridges
    const ridgeCount = 7;
    for (let r = 0; r < ridgeCount; r++) {
      const angle = (r / ridgeCount) * Math.PI * 2;
      const distance = 40 + Math.random() * 50;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      const length = 18 + Math.random() * 22;
      const height = 2.5 + Math.random() * 3.5;
      
      const collider = new THREE.Mesh(
        new THREE.BoxGeometry(length, height, 0.9),
        invisibleMaterial
      );
      collider.position.set(x, height * 0.5 + 0.3, z);
      collider.rotation.y = Math.random() * Math.PI;
      collider.rotation.z = (Math.random() - 0.5) * 0.12;
      collider.userData = {
        isWalkable: true,
        collisionEnabled: true,
        terrainType: 'fractalRidge',
        height: height
      };
      
      this.worldRoot.add(collider);
      this.collisionObjects.push(collider);
    }
    
    // Collision for fragments
    const fragmentCount = 18;
    for (let f = 0; f < fragmentCount; f++) {
      const x = (Math.random() - 0.5) * 170;
      const z = (Math.random() - 0.5) * 170;
      const floatHeight = 3.5 + Math.random() * 9;
      const size = 0.22 + Math.random() * 0.55;
      
      const collider = new THREE.Mesh(
        new THREE.BoxGeometry(size * 1.4, size * 1.4, size * 1.4),
        invisibleMaterial
      );
      collider.position.set(x, floatHeight, z);
      collider.userData = {
        isWalkable: true,
        collisionEnabled: true,
        terrainType: 'floatingFragment'
      };
      
      this.worldRoot.add(collider);
      this.collisionObjects.push(collider);
    }
  }
  
  /**
   * Get collision objects for physics
   */
  getCollisionObjects() {
    return this.collisionObjects;
  }
  
  /**
   * Update animations and effects
   */
  update(deltaTime, time) {
    // Update reference plane (canonical contract)
    if (this.referencePlane && this.referencePlane.animate) {
      this.referencePlane.animate(deltaTime, time);
    }
    
    this.animatedObjects.forEach(obj => {
      // Float fragments with rotation
      if (obj.type === 'floatFragment') {
        const data = obj.object.userData;
        
        // Smooth bobbing motion
        const float = Math.sin(time * data.floatSpeed + data.floatOffset) * data.floatAmount;
        obj.object.position.y = data.baseY + float;
        
        // Smooth rotation
        obj.object.rotation.x += data.rotationSpeed.x;
        obj.object.rotation.y += data.rotationSpeed.y;
        obj.object.rotation.z += data.rotationSpeed.z;
      }
      
      // Drifting particles
      if (obj.type === 'particles') {
        const psData = this.particleSystems.find(ps => ps.object === obj.object);
        if (psData) {
          const positions = psData.object.geometry.attributes.position.array;
          const velocities = psData.velocities;
          
          for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            // Wrap around with smooth falloff
            if (Math.abs(positions[i]) > psData.bounds) {
              positions[i] = -positions[i];
              velocities[i] = -velocities[i];
            }
            if (positions[i + 1] > 45) {
              positions[i + 1] = -2;
              velocities[i + 1] = Math.abs(velocities[i + 1]);
            }
            if (Math.abs(positions[i + 2]) > psData.bounds) {
              positions[i + 2] = -positions[i + 2];
              velocities[i + 2] = -velocities[i + 2];
            }
          }
          
          obj.object.geometry.attributes.position.needsUpdate = true;
        }
      }
      
      // Shimmer particles
      if (obj.type === 'shimmerParticles') {
        const psData = this.particleSystems.find(ps => ps.object === obj.object);
        if (psData) {
          const positions = psData.object.geometry.attributes.position.array;
          const velocities = psData.velocities;
          
          for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            if (Math.abs(positions[i]) > psData.bounds) {
              positions[i] = -positions[i];
              velocities[i] = -velocities[i];
            }
            if (positions[i + 1] > 20) {
              positions[i + 1] = 0.5;
              velocities[i + 1] = Math.abs(velocities[i + 1]);
            }
            if (Math.abs(positions[i + 2]) > psData.bounds) {
              positions[i + 2] = -positions[i + 2];
              velocities[i + 2] = -velocities[i + 2];
            }
          }
          
          obj.object.geometry.attributes.position.needsUpdate = true;
        }
      }
      
      // Volumetric pulsing rays
      if (obj.type === 'volumetricRays') {
        const pulse = Math.sin(time * obj.pulseSpeed) * 0.5 + 0.5;
        obj.object.material.opacity = obj.baseOpacity * (0.5 + pulse * 0.5);
      }
      
      // Light shafts - gentle rotation and pulsing
      if (obj.type === 'lightShafts') {
        obj.angle += 0.0002;
        obj.object.rotation.z = obj.angle;
        const pulse = Math.sin(time * 0.3) * 0.5 + 0.5;
        obj.object.material.opacity = 0.03 + (pulse * 0.05);
      }
    });
  }
}
