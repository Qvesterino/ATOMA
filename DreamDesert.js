import * as THREE from 'three';
import { initMapReferencePlane } from './MapReferencePlaneFactory.js';
import { getMapConfig } from './MapConfigBase.js';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';

/**
 * Dream Desert - AI Subconscious Environment
 * Surreal, peaceful, geometric desertscape
 */
export class DreamDesert {
  constructor({ scene, worldRoot, camera = null }) {
    console.log('WORLD CONSTRUCTOR:', this.constructor.name);
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.camera = camera;
    this.crystals = [];
    this.fragments = [];
    this.energyVeins = [];
    
    // Session 112+: Initialize map reference plane from config
    this.initializeMapConfig();
    this.initializeReferencePlane();
    
    this.createDesertTerrain();
    this.createEnergyVeins();
    this.createHolographicCrystals();
    this.createFloatingFragments();
    this.createDreamParticles();
    this.createAuroraRibbons();
    this.createHorizonGlitch();
  }
  
  /**
   * Initialize map configuration
   */
  initializeMapConfig() {
    this.mapConfig = getMapConfig('DreamDesert');
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
   * Create geometric dunes with neural patterns
   */
  createDesertTerrain() {
    // Main desert floor - large flat base
    const desertSize = 200;
    const desertGeometry = new THREE.PlaneGeometry(desertSize, desertSize);
    const desertMaterial = materialRegistry.getStandard('world.dreamdesert.desertFloor', {
      color: 0xe8d4f8,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide,         // Visible from both sides (top-down camera)
      depthWrite: true,               // Write to depth buffer
      depthTest: true,                // Test depth for proper ordering
      opacity: 1.0,                   // Full opacity
      transparent: false,              // Not transparent
      emissive: 0x000000,            // No emissive override
      emissiveIntensity: 0           // No glow
    });
    const desert = new THREE.Mesh(desertGeometry, desertMaterial);
    desert.rotation.x = -Math.PI / 2;
    desert.receiveShadow = true;
    desert.castShadow = false;
    
    // Ensure terrain is on default layer (layer 0)
    desert.layers.set(0);
    desert.renderOrder = -100;  // Render before most objects
    
    // Store reference for potential updates
    this.desert = desert;
    
    this.worldRoot.add(desert);
    
    // Create geometric dunes with subtle patterns
    this.dunes = [];
    const duneCount = 12;
    
    for (let i = 0; i < duneCount; i++) {
      const angle = (i / duneCount) * Math.PI * 2;
      const distance = 20 + Math.random() * 40;
      
      // Create smooth geometric dune
      const duneGeometry = this.createGeometricDune();
      const duneMaterial = materialRegistry.getStandard('world.dreamdesert.dune', {
        color: this.getDuneColor(),
        roughness: 0.8,
        metalness: 0.15,
        flatShading: false,
        side: THREE.FrontSide,          // ✅ Ensure front face visible
        depthWrite: true,               // ✅ Write to depth buffer
        depthTest: true                 // ✅ Test depth
      });
      
      const dune = new THREE.Mesh(duneGeometry, duneMaterial);
      dune.position.x = Math.cos(angle) * distance;
      dune.position.z = Math.sin(angle) * distance;
      dune.position.y = -0.5;
      dune.rotation.y = Math.random() * Math.PI * 2;
      
      // Ensure dunes render after floor but before transparents
      dune.renderOrder = -90; 
      
      dune.userData = {
        originalY: dune.position.y,
        breathSpeed: 0.1 + Math.random() * 0.05,
        breathOffset: Math.random() * Math.PI * 2
      };
      
      this.worldRoot.add(dune);
      this.dunes.push(dune);
    }
  }
  
  /**
   * Create geometric dune shape with hex/wave patterns
   */
  createGeometricDune() {
    const width = 15 + Math.random() * 10;
    const height = 3 + Math.random() * 4;
    const depth = 10 + Math.random() * 8;
    
    // Use smooth subdivision for organic feel
    const geometry = new THREE.CylinderGeometry(
      width * 0.3,
      width,
      height,
      16,
      4,
      false
    );
    
    // Apply subtle wave pattern to vertices
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      // Hex-like distortion
      const hexPattern = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.5;
      positions.setY(i, y + hexPattern);
    }
    
    geometry.computeVertexNormals();
    geometry.scale(1, 1, depth / width);
    
    return geometry;
  }
  
  /**
   * Get pastel dune color
   */
  getDuneColor() {
    const colors = [
      0xf5d0f0,  // Soft pink
      0xd4e8f8,  // Soft teal
      0xe8d4f8,  // Soft violet
      0xf0e8ff,  // Soft lavender
      0xddf0f5   // Soft cyan
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Create pulsing energy veins under dunes
   */
  createEnergyVeins() {
    const veinCount = 8;
    
    for (let i = 0; i < veinCount; i++) {
      const angle = (i / veinCount) * Math.PI * 2;
      
      // Create curved vein path
      const points = [];
      const segments = 20;
      const distance = 50;
      
      for (let j = 0; j < segments; j++) {
        const t = j / segments;
        const radius = t * distance;
        const angleOffset = Math.sin(t * Math.PI * 2) * 0.3;
        
        points.push(new THREE.Vector3(
          Math.cos(angle + angleOffset) * radius,
          -0.3 + Math.sin(t * Math.PI * 4) * 0.2,
          Math.sin(angle + angleOffset) * radius
        ));
      }
      
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 40, 0.05, 8, false);
      const tubeMaterial = materialRegistry.getBasic('world.dreamdesert.energyVein', {
        color: 0x00ddff,
        transparent: true,
        opacity: 0.15,
        emissive: 0x00ddff,
        emissiveIntensity: 0.3,
        depthWrite: false,              // ✅ Prevent occlusion of other transparents
        side: THREE.FrontSide           // ✅ Optimization
      });
      
      const vein = new THREE.Mesh(tubeGeometry, tubeMaterial);
      vein.renderOrder = 10;            // ✅ Draw after opaque geometry
      vein.userData = {
        pulseOffset: Math.random() * Math.PI * 2
      };
      
      this.worldRoot.add(vein);
      this.energyVeins.push(vein);
    }
  }
  
  /**
   * Create floating holographic crystals
   */
  createHolographicCrystals() {
    const crystalCount = 15;
    
    for (let i = 0; i < crystalCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 10 + Math.random() * 50;
      
      // Create crystal geometry
      const geometry = new THREE.OctahedronGeometry(1 + Math.random() * 1.5, 0);
      const material = materialRegistry.getStandard('world.dreamdesert.crystal', {
        color: this.getCrystalColor(),
        transparent: true,
        opacity: 0.4,
        emissive: this.getCrystalColor(),
        emissiveIntensity: 0.2,
        metalness: 0.8,
        roughness: 0.2,
        depthWrite: false,              // ✅ Holographic look (no self-occlusion)
        side: THREE.FrontSide
      });
      
      const crystal = new THREE.Mesh(geometry, material);
      crystal.renderOrder = 20;         // ✅ Draw after veins
      crystal.position.x = Math.cos(angle) * distance;
      crystal.position.z = Math.sin(angle) * distance;
      crystal.position.y = 2 + Math.random() * 6;
      
      crystal.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      crystal.userData = {
        floatSpeed: 0.2 + Math.random() * 0.15,
        floatOffset: Math.random() * Math.PI * 2,
        rotationSpeed: 0.1 + Math.random() * 0.1,
        originalY: crystal.position.y
      };
      
      this.worldRoot.add(crystal);
      this.crystals.push(crystal);
    }
  }
  
  /**
   * Get crystal color
   */
  getCrystalColor() {
    const colors = [
      0xff99dd,  // Pink
      0x99ddff,  // Teal
      0xdd99ff,  // Violet
      0x99ffdd   // Mint
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * Create levitating geometric fragments
   */
  createFloatingFragments() {
    const fragmentCount = 10;
    
    const geometries = [
      new THREE.BoxGeometry(2, 0.2, 2),
      new THREE.BoxGeometry(1.5, 0.15, 3),
      new THREE.PlaneGeometry(2, 2)
    ];
    
    for (let i = 0; i < fragmentCount; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)].clone();
      const material = materialRegistry.getStandard('world.dreamdesert.fragment', {
        color: 0xccddff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        metalness: 0.6,
        roughness: 0.4,
        depthWrite: false               // ✅ Ghostly floating fragments
      });
      
      const fragment = new THREE.Mesh(geometry, material);
      fragment.renderOrder = 20;        // ✅ Draw with crystals
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 15 + Math.random() * 40;
      
      fragment.position.x = Math.cos(angle) * distance;
      fragment.position.z = Math.sin(angle) * distance;
      fragment.position.y = 4 + Math.random() * 8;
      
      fragment.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      fragment.userData = {
        floatSpeed: 0.15 + Math.random() * 0.1,
        floatOffset: Math.random() * Math.PI * 2,
        rotationSpeed: 0.05 + Math.random() * 0.05,
        originalY: fragment.position.y
      };
      
      this.worldRoot.add(fragment);
      this.fragments.push(fragment);
    }
  }
  
  /**
   * Create dreamlike particle drift
   */
  createDreamParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const velocities = [];
    
    const particleCount = 200;
    
    const color1 = new THREE.Color(0xff99dd);
    const color2 = new THREE.Color(0x99ddff);
    const color3 = new THREE.Color(0xdd99ff);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 80;
      const x = Math.cos(angle) * radius;
      const y = Math.random() * 20;
      const z = Math.sin(angle) * radius;
      
      positions.push(x, y, z);
      
      const colorChoice = Math.random();
      const color = colorChoice < 0.33 ? color1 :
                    colorChoice < 0.66 ? color2 : color3;
      colors.push(color.r, color.g, color.b);
      
      velocities.push(
        (Math.random() - 0.5) * 0.1,
        Math.random() * 0.05 + 0.02,
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
      blending: THREE.AdditiveBlending,
      depthWrite: false                 // ✅ Particles shouldn't block depth
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.particles.renderOrder = 30;    // ✅ Draw last (additive)
    this.particles.userData.velocities = velocities;
    this.worldRoot.add(this.particles);
  }
  
  /**
   * Create aurora-like ribbons in sky
   */
  createAuroraRibbons() {
    this.auroraRibbons = [];
    
    for (let i = 0; i < 3; i++) {
      const points = [];
      const segments = 30;
      const yHeight = 25 + i * 5;
      
      for (let j = 0; j < segments; j++) {
        const x = (j / segments) * 120 - 60;
        const z = -40 + i * 10;
        const y = yHeight + Math.sin(j * 0.3) * 3;
        points.push(new THREE.Vector3(x, y, z));
      }
      
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 60, 0.5, 8, false);
      
      const color = i === 0 ? 0xff99dd : i === 1 ? 0x99ddff : 0xdd99ff;
      const tubeMaterial = materialRegistry.getBasic('world.dreamdesert.auroraRibbon', {
        color: color,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,              // ✅ No z-fighting for ribbons
        blending: THREE.AdditiveBlending // ✅ Glow effect
      });
      
      const ribbon = new THREE.Mesh(tubeGeometry, tubeMaterial);
      ribbon.renderOrder = 5;           // ✅ Background atmosphere
      ribbon.userData = {
        waveOffset: i * Math.PI / 3
      };
      
      this.worldRoot.add(ribbon);
      this.auroraRibbons.push(ribbon);
    }
  }
  
  /**
   * Create glitch distortions on horizon
   */
  createHorizonGlitch() {
    this.glitchPlanes = [];
    
    for (let i = 0; i < 4; i++) {
      const geometry = new THREE.PlaneGeometry(30, 10, 10, 5);
      const material = materialRegistry.getBasic('world.dreamdesert.horizonGlitch', {
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        wireframe: true,
        depthWrite: false               // ✅ Glitch overlays don't write depth
      });
      
      const plane = new THREE.Mesh(geometry, material);
      plane.renderOrder = 100;          // ✅ Draw absolutely last (HUD-like)
      
      const angle = (i / 4) * Math.PI * 2;
      plane.position.x = Math.cos(angle) * 70;
      plane.position.z = Math.sin(angle) * 70;
      plane.position.y = 10;
      plane.lookAt(0, 10, 0);
      
      plane.userData = {
        glitchTimer: Math.random() * 10,
        glitchDuration: 0
      };
      
      this.worldRoot.add(plane);
      this.glitchPlanes.push(plane);
    }
  }
  
  /**
   * Update dream desert animations
   */
  update(deltaTime, time) {
    // Session 112+: Update reference plane
    if (this.referencePlane && this.referencePlane.animate) {
      this.referencePlane.animate(deltaTime, time);
    }
    
    // Dunes gentle breathing
    if (this.dunes) {
      this.dunes.forEach(dune => {
        const data = dune.userData;
        const breath = Math.sin(time * data.breathSpeed + data.breathOffset) * 0.1;
        dune.position.y = data.originalY + breath;
      });
    }
    
    // Energy veins pulsing
    this.energyVeins.forEach(vein => {
      const pulse = Math.sin(time * 0.8 + vein.userData.pulseOffset);
      vein.material.opacity = 0.1 + pulse * 0.08;
      vein.material.emissiveIntensity = 0.2 + pulse * 0.15;
    });
    
    // Crystals floating and rotating
    this.crystals.forEach(crystal => {
      const data = crystal.userData;
      
      crystal.position.y = data.originalY + 
        Math.sin(time * data.floatSpeed + data.floatOffset) * 1.5;
      
      crystal.rotation.x += data.rotationSpeed * deltaTime;
      crystal.rotation.y += data.rotationSpeed * deltaTime * 0.7;
      
      const pulse = Math.sin(time * 2) * 0.1;
      crystal.material.emissiveIntensity = 0.2 + pulse;
    });
    
    // Fragments floating
    this.fragments.forEach(fragment => {
      const data = fragment.userData;
      
      fragment.position.y = data.originalY + 
        Math.sin(time * data.floatSpeed + data.floatOffset) * 2;
      
      fragment.rotation.x += data.rotationSpeed * deltaTime;
      fragment.rotation.y += data.rotationSpeed * deltaTime * 1.5;
    });
    
    // Particles drifting
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.userData.velocities;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * deltaTime * 10;
        positions[i + 1] += velocities[i + 1] * deltaTime * 10;
        positions[i + 2] += velocities[i + 2] * deltaTime * 10;
        
        // Reset if too high or too far
        if (positions[i + 1] > 25 || Math.sqrt(
          positions[i] * positions[i] + 
          positions[i + 2] * positions[i + 2]
        ) > 90) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 70;
          positions[i] = Math.cos(angle) * radius;
          positions[i + 1] = 0;
          positions[i + 2] = Math.sin(angle) * radius;
        }
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Aurora ribbons gentle wave
    this.auroraRibbons.forEach(ribbon => {
      const wave = Math.sin(time * 0.3 + ribbon.userData.waveOffset);
      ribbon.material.opacity = 0.12 + wave * 0.05;
    });
    
    // Horizon glitch effect
    this.glitchPlanes.forEach(plane => {
      plane.userData.glitchTimer -= deltaTime;
      
      if (plane.userData.glitchTimer <= 0 && plane.userData.glitchDuration <= 0) {
        // Start glitch
        plane.userData.glitchDuration = 0.1 + Math.random() * 0.2;
        plane.userData.glitchTimer = 3 + Math.random() * 7;
      }
      
      if (plane.userData.glitchDuration > 0) {
        plane.userData.glitchDuration -= deltaTime;
        plane.material.opacity = 0.1 + Math.random() * 0.1;
        
        // Distort vertices
        const positions = plane.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          if (Math.random() > 0.7) {
            positions.setY(i, positions.getY(i) + (Math.random() - 0.5) * 2);
          }
        }
        positions.needsUpdate = true;
      } else {
        plane.material.opacity = 0;
      }
    });
  }
}
