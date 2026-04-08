import * as THREE from 'three';
import { initMapReferencePlane } from './MapReferencePlaneFactory.js';
import { getMapConfig } from './MapConfigBase.js';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';

/**
 * Dream Desert - AI Subconscious Environment
 * Surreal, peaceful, geometric desertscape
 */
export class DreamDesert {
  constructor(scene, worldRoot, camera = null) {
    console.log('WORLD CONSTRUCTOR:', this.constructor.name);
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.camera = camera;
    this.crystals = [];
    this.fragments = [];
    this.energyVeins = [];
    this.collisionObjects = []; // Track collision meshes
    
    // Session 112+: Initialize map reference plane from config
    this.initializeMapConfig();
    this.initializeReferencePlane();
    
    this.createDesertTerrain();
    this.createLighting();
    this.createEnergyVeins();
    this.createHolographicCrystals();
    this.createFloatingFragments();
    this.createDreamParticles();
    this.createDustDevils();
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
   * Create geometric dunes with neural patterns
   */
  createDesertTerrain() {
    // Main desert floor - large segmented base with gentle relief
    const desertSize = 200;
    const desertGeometry = new THREE.PlaneGeometry(desertSize, desertSize, 80, 80);
    const positionAttribute = desertGeometry.getAttribute('position');
    const positions = positionAttribute.array;
    const colors = new Float32Array(positions.length);
    const centerColor = new THREE.Color(0xe8d4f8);
    const edgeColor = new THREE.Color(0xc8b4d8);

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];
      const radius = Math.sqrt(x * x + z * z) / (desertSize * 0.5);
      const falloff = Math.pow(Math.max(0, 1 - radius), 1.8);

      const height = Math.sin(x * 0.05) * Math.cos(z * 0.045) * 2.1
        + Math.sin(x * 0.14 + z * 0.08) * 1.1
        + Math.cos(z * 0.09) * 0.8;
      positions[i + 2] = height * falloff * 0.45;

      const color = centerColor.clone().lerp(edgeColor, Math.min(1, radius));
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    positionAttribute.needsUpdate = true;
    desertGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    desertGeometry.computeVertexNormals();

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
      emissiveIntensity: 0,          // No glow
      vertexColors: true
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
    
    // Create collision mesh for desert floor (invisible but raycastable)
    // Use material with colorWrite=false and depthWrite=false for invisible but raycastable mesh
    const collisionMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide
    });
    const desertCollision = new THREE.Mesh(desertGeometry.clone(), collisionMaterial);
    desertCollision.rotation.x = -Math.PI / 2;
    desertCollision.position.copy(desert.position);
    desertCollision.userData = {
      isWalkable: true,
      collisionEnabled: true,
      terrainType: 'desertFloor'
    };
    // Mark as raycastable for ATOMA's raycast system
    desertCollision.userData.__ALLOW_RAYCAST__ = true;
    this.worldRoot.add(desertCollision);
    this.collisionObjects.push(desertCollision);
    
    // Create geometric dunes with subtle patterns
    this.dunes = [];
    const duneCount = 12;
    
    // Reuse collision material for all dunes (invisible but raycastable)
    const duneCollisionMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide
    });
    
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
        originalScaleY: dune.scale.y,
        breathSpeed: 0.1 + Math.random() * 0.05,
        breathOffset: Math.random() * Math.PI * 2
      };
      
      this.worldRoot.add(dune);
      this.dunes.push(dune);
      
      // Create collision mesh for dune (invisible but raycastable)
      const duneCollision = new THREE.Mesh(duneGeometry.clone(), duneCollisionMaterial);
      duneCollision.position.copy(dune.position);
      duneCollision.rotation.copy(dune.rotation);
      duneCollision.userData = {
        isWalkable: true,
        collisionEnabled: true,
        terrainType: 'dune',
        height: duneGeometry.parameters.height || 5,
        __ALLOW_RAYCAST__: true
      };
      this.worldRoot.add(duneCollision);
      this.collisionObjects.push(duneCollision);
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
  createLighting() {
    if (this.scene) {
      this.scene.fog = new THREE.FogExp2(0x1a0a20, 0.006);
      this.scene.background = new THREE.Color(0x0d0515);
    }

    const skyGeometry = new THREE.SphereGeometry(150, 16, 16);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTopColor: { value: new THREE.Color(0x12031a) },
        uBottomColor: { value: new THREE.Color(0x4e2d6f) }
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
        varying vec3 vWorldPosition;
        uniform vec3 uTopColor;
        uniform vec3 uBottomColor;
        void main() {
          float t = normalize(vWorldPosition).y * 0.5 + 0.5;
          vec3 color = mix(uBottomColor, uTopColor, smoothstep(0.0, 1.0, t));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false
    });
    const skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
    skySphere.name = 'dreamSkySphere';
    skySphere.renderOrder = -1;
    this.worldRoot.add(skySphere);

    const hemisphere = new THREE.HemisphereLight(0xe8d4f8, 0x2a1a3a, 0.4);
    this.worldRoot.add(hemisphere);

    const directional = new THREE.DirectionalLight(0xffe8ff, 0.5);
    directional.position.set(50, 60, 40);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.near = 1;
    directional.shadow.camera.far = 180;
    directional.shadow.camera.left = -80;
    directional.shadow.camera.right = 80;
    directional.shadow.camera.top = 80;
    directional.shadow.camera.bottom = -80;
    this.worldRoot.add(directional);

    const helper = null;
    if (this.scene && this.scene.userData && this.scene.userData.debugLights) {
      // Optional debug helper when debug mode is enabled
      // eslint-disable-next-line no-unused-vars
      const lightHelper = new THREE.DirectionalLightHelper(directional, 8, 0xff99ff);
      this.worldRoot.add(lightHelper);
    }
  }

  createCrystalGlowTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0.0, 'rgba(232, 192, 255, 0.9)');
    gradient.addColorStop(0.35, 'rgba(232, 192, 255, 0.55)');
    gradient.addColorStop(0.65, 'rgba(232, 192, 255, 0.18)');
    gradient.addColorStop(1.0, 'rgba(232, 192, 255, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  createCrystalGlowMaterial() {
    if (!this.crystalGlowTexture) {
      this.crystalGlowTexture = this.createCrystalGlowTexture();
    }
    return new THREE.SpriteMaterial({
      map: this.crystalGlowTexture,
      color: 0xe8d4f8,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      toneMapped: false
    });
  }

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
      const linePoints = curve.getPoints(segments);
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00ddff,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      });
      
      const vein = new THREE.Line(lineGeometry, lineMaterial);
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

      if (!this.crystalGlowMaterial) {
        this.crystalGlowMaterial = this.createCrystalGlowMaterial();
      }
      const glow = new THREE.Sprite(this.crystalGlowMaterial);
      glow.scale.set(4, 4, 1);
      glow.position.set(0, 0, 0);
      crystal.add(glow);
      
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
   * Create small ascending dust devil spirals
   */
  createDustDevils() {
    const dustCount = 36;
    const particleCount = dustCount;
    const positions = new Float32Array(particleCount * 3);
    const angles = new Float32Array(particleCount);
    const centersX = new Float32Array(particleCount);
    const centersZ = new Float32Array(particleCount);
    const baseRadius = new Float32Array(particleCount);
    const heights = new Float32Array(particleCount);
    const riseSpeeds = new Float32Array(particleCount);
    const rotSpeeds = new Float32Array(particleCount);
    const maxHeight = 12.0;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const devils = [
      { x: -55, z: 48 },
      { x: 62, z: -37 }
    ];

    for (let i = 0; i < particleCount; i++) {
      const devilIndex = i % devils.length;
      const center = devils[devilIndex];
      centersX[i] = center.x;
      centersZ[i] = center.z;
      angles[i] = Math.random() * Math.PI * 2;
      baseRadius[i] = 4.5 + Math.random() * 3.5;
      heights[i] = Math.random() * maxHeight * 0.25;
      riseSpeeds[i] = 0.7 + Math.random() * 0.35;
      rotSpeeds[i] = 0.3 + Math.random() * 0.18;
      const radius = baseRadius[i] * (1.0 - heights[i] / maxHeight);
      positions[i * 3] = centersX[i] + Math.cos(angles[i] + i * goldenAngle) * radius;
      positions[i * 3 + 1] = heights[i];
      positions[i * 3 + 2] = centersZ[i] + Math.sin(angles[i] + i * goldenAngle) * radius;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(particleCount).map(() => 2.0 + Math.random() * 1.2), 1));

    const material = new THREE.PointsMaterial({
      color: 0xe8d4f8,
      size: 2.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });

    const points = new THREE.Points(geometry, material);
    points.name = 'dustDevilParticles';
    points.renderOrder = 15;
    this.worldRoot.add(points);
    this.dustDevilData = {
      object: points,
      count: particleCount,
      positions,
      angles,
      centersX,
      centersZ,
      baseRadius,
      heights,
      riseSpeeds,
      rotSpeeds,
      maxHeight,
      goldenAngle
    };
  }

  /**
   * Create aurora-like ribbons in sky
   */
  createAuroraRibbons() {
    this.auroraRibbons = [];
    this.auroraRibbonData = {
      curves: [],
      ts: [],
      speeds: [],
      curveIndices: [],
      count: 0
    };

    const totalPointsPerCurve = 50;
    const colorPalette = [
      new THREE.Color(0xff99dd),
      new THREE.Color(0x99ddff),
      new THREE.Color(0xdd99ff)
    ];

    const positions = new Float32Array(totalPointsPerCurve * 3 * 3);
    const colors = new Float32Array(totalPointsPerCurve * 3 * 3);
    const sizes = new Float32Array(totalPointsPerCurve * 3);

    let pointIndex = 0;
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
      this.auroraRibbonData.curves.push(curve);

      for (let j = 0; j < totalPointsPerCurve; j++) {
        const t = j / totalPointsPerCurve;
        const position = curve.getPointAt(t);
        positions[pointIndex * 3] = position.x;
        positions[pointIndex * 3 + 1] = position.y;
        positions[pointIndex * 3 + 2] = position.z;

        const color = colorPalette[i].clone().lerp(new THREE.Color(0xffffff), 0.3);
        colors[pointIndex * 3] = color.r;
        colors[pointIndex * 3 + 1] = color.g;
        colors[pointIndex * 3 + 2] = color.b;

        sizes[pointIndex] = 1.5 + Math.random() * 1.5;

        this.auroraRibbonData.ts.push(t);
        this.auroraRibbonData.speeds.push(0.02 + Math.random() * 0.015);
        this.auroraRibbonData.curveIndices.push(i);
        pointIndex += 1;
      }
    }

    this.auroraRibbonData.count = pointIndex;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('vColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: window.devicePixelRatio || 1 }
      },
      vertexShader: `
        attribute float aSize;
        attribute vec3 vColor;
        varying vec3 vColorOut;
        uniform float uPixelRatio;
        void main() {
          vColorOut = vColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (uPixelRatio / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColorOut;
        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float dist = length(uv);
          float alpha = smoothstep(1.0, 0.4, dist);
          if (alpha < 0.05) discard;
          gl_FragColor = vec4(vColorOut, alpha * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const auroraPoints = new THREE.Points(geometry, material);
    auroraPoints.renderOrder = 5;
    auroraPoints.name = 'auroraRibbonPoints';
    this.worldRoot.add(auroraPoints);
    this.auroraRibbons.push(auroraPoints);
  }
  
  /**
   * Create glitch distortions on horizon
   */
  createHorizonGlitch() {
    this.glitchPlanes = [];
    const baseRadius = 70;

    for (let i = 0; i < 4; i++) {
      const linePoints = [];
      const segmentCount = 10;
      const angle = (i / 4) * Math.PI * 2;
      const baseX = Math.cos(angle) * baseRadius;
      const baseZ = Math.sin(angle) * baseRadius;
      const baseY = 10;
      const lineLength = 36;
      const sideOffset = i % 2 === 0 ? 12 : -12;

      for (let j = 0; j <= segmentCount; j++) {
        const t = j / segmentCount;
        const offset = (t - 0.5) * lineLength;
        linePoints.push(new THREE.Vector3(baseX + Math.cos(angle) * offset, baseY, baseZ + Math.sin(angle) * offset));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      });

      const line = new THREE.Line(geometry, material);
      line.renderOrder = 100;
      line.position.y = baseY;
      line.rotation.y = angle + Math.PI * 0.5;
      line.scale.set(1, 1, 1);

      line.userData = {
        glitchTimer: Math.random() * 10,
        glitchDuration: 0,
        baseY,
        baseScaleX: 1,
        baseScaleZ: 1,
        phase: Math.random() * Math.PI * 2
      };

      this.worldRoot.add(line);
      this.glitchPlanes.push(line);
    }
  }

  getCollisionObjects() {
    return this.collisionObjects;
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
        const breath = Math.sin(time * data.breathSpeed + data.breathOffset) * 0.04;
        dune.scale.y = data.originalScaleY + breath;
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
    
    // Dust devil spirals
    if (this.dustDevilData) {
      const data = this.dustDevilData;
      const positions = data.positions;
      for (let i = 0; i < data.count; i++) {
        data.angles[i] += data.rotSpeeds[i] * deltaTime;
        data.heights[i] += data.riseSpeeds[i] * deltaTime;
        if (data.heights[i] > data.maxHeight) {
          data.heights[i] = 0;
          data.angles[i] = Math.random() * Math.PI * 2;
        }
        const t = Math.min(1.0, data.heights[i] / data.maxHeight);
        const radius = Math.max(0.15, data.baseRadius[i] * (1.0 - t));
        const angle = data.angles[i] + i * data.goldenAngle;
        positions[i * 3] = data.centersX[i] + Math.cos(angle) * radius;
        positions[i * 3 + 1] = data.heights[i];
        positions[i * 3 + 2] = data.centersZ[i] + Math.sin(angle) * radius;
      }
      data.object.geometry.attributes.position.needsUpdate = true;
    }

    // Aurora ribbons flowing along curves
    if (this.auroraRibbons.length && this.auroraRibbonData) {
      const ribbonPoints = this.auroraRibbons[0];
      const positions = ribbonPoints.geometry.attributes.position.array;
      const data = this.auroraRibbonData;

      for (let i = 0; i < data.count; i++) {
        data.ts[i] += data.speeds[i] * deltaTime;
        if (data.ts[i] > 1.0) data.ts[i] -= 1.0;
        const curve = data.curves[data.curveIndices[i]];
        const pos = curve.getPointAt(data.ts[i]);
        positions[i * 3] = pos.x;
        positions[i * 3 + 1] = pos.y;
        positions[i * 3 + 2] = pos.z;
      }

      ribbonPoints.geometry.attributes.position.needsUpdate = true;
    }

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
        const progress = plane.userData.glitchDuration / 0.25;
        plane.material.opacity = 0.08 + Math.sin(time * 25 + plane.userData.phase) * 0.04;
        plane.position.y = plane.userData.baseY + Math.sin(time * 14 + plane.userData.phase) * 0.5;
        plane.scale.x = 1.0 + Math.sin(time * 22 + plane.userData.phase) * 0.16;
        plane.scale.z = 1.0 + Math.cos(time * 18 + plane.userData.phase) * 0.12;
      } else {
        plane.material.opacity = 0;
        plane.position.y = plane.userData.baseY;
        plane.scale.x = 1.0;
        plane.scale.z = 1.0;
      }
    });
  }
}
