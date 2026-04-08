import * as THREE from 'three';
import { CONFIG } from './config.js';
import { initMapReferencePlane } from './MapReferencePlaneFactory.js';
import { getMapConfig } from './MapConfigBase.js';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';
import { createSigmaRift, updateRiftEnergyTime } from './shaders/RiftEnergyShader.js';

/**
 * Sigma Rift Chamber - Boss-level arena
 * An ancient, sacred AI chamber built around a gigantic glowing Rift
 * NOTE: Keep the chamber floor ground helper analytic so the player controller never has to raycast the arena.
 * NOTE: The floor mesh is walkable terrain even though it is listed in collisionObjects; blockers must be tagged explicitly.
 */
export class SigmaRiftChamber {
  constructor(scene, worldRoot, camera = null) {
    this.scene = scene;
    this.scene.background = new THREE.Color(0x020208);
    this.scene.fog = new THREE.FogExp2(0x020208, 0.008);
    this.worldRoot = worldRoot;
    this.camera = camera;
    this.animatedObjects = [];
    this.collisionObjects = [];
    this.monolithShadows = [];
    this.monolithShadowMaterial = null;
    this.monolithTethers = [];
    this.monolithTetherMaterial = null;
    this.wallSymbols = [];
    this.runeSequencePhase = 0;
    this.runeSequenceTimer = 20 + Math.random() * 3;
    this.runeSequenceProgress = 0;
    this.floorSigilElapsed = 0;
    this.floorSigilCompleted = false;
    this.floorSigilFlashActive = false;
    this.floorSigilFlashProgress = 0;
    this.pathBurstTimer = 6 + Math.random() * 2;
    this.pathBurstActive = false;
    this.pathBurstProgress = 0;
    this.holographicRingBaseSpeed = 0.1;
    this.holographicPulseTimer = 5 + Math.random() * 1.5;
    this.holographicPulseActive = false;
    this.holographicPulseProgress = 0;
    this.chamberRadius = 60;
    this.chamberHeight = 50;
    this.riftHeight = 18;
    this.playerGroundOffset = 1;
    this.riftEyeSprite = null;
    this.riftEyeTimer = 15 + Math.random() * 4;
    this.riftEyeActive = false;
    this.riftEyeProgress = 0;
    
    // Session 112+: Initialize map configuration and reference plane
    this.initializeMapConfig();
    this.initializeReferencePlane();
    
    this.createCeiling();
    this.createWalls();
    this.createFloor();
    this.createCentralRift();
    this.createRiftEye();
    this.createRiftSurgeWave();
    this.createFloatingMonoliths();
    this.createHolographicRings();
    this.createNeonPaths();
    this.createParticleDrift();
  }
  
  /**
   * Initialize map configuration
   */
  initializeMapConfig() {
    this.mapConfig = getMapConfig('SigmaRiftChamber');
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
  
  createCeiling() {
    const starfieldGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    const starColors = [];
    const starVelocities = [];
    
    const constellationCount = 200;
    const topY = this.chamberHeight - 1.5;
    const spawnRadius = this.chamberRadius * 0.95;
    for (let i = 0; i < constellationCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = spawnRadius * (0.9 + Math.random() * 0.1);
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const height = topY + (Math.random() - 0.5) * 0.3;
      
      starPositions.push(x, height, z);
      
      const intensity = 0.6 + Math.random() * 0.4;
      starColors.push(
        0.1 * intensity,
        0.7 * intensity,
        0.25 * intensity
      );

      const dirX = -x;
      const dirZ = -z;
      const length = Math.sqrt(dirX * dirX + dirZ * dirZ) + 0.0001;
      const speed = 0.03 + Math.random() * 0.02;
      starVelocities.push((dirX / length) * speed, (dirZ / length) * speed);
    }
    
    starfieldGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    starfieldGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    
    const starfieldMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.starfield = new THREE.Points(starfieldGeometry, starfieldMaterial);
    this.worldRoot.add(this.starfield);
    this.starfieldData = {
      velocities: starVelocities,
      topY: topY,
      spawnRadius: spawnRadius,
      minDistance: 1.0
    };
    
    this.createSigmaRuneLights();
  }
  
  createSigmaRuneLights() {
    const runeCount = 6;
    
    for (let r = 0; r < runeCount; r++) {
      const baseAngle = (r / runeCount) * Math.PI * 2;
      const runeDistance = 35 + Math.random() * 10;
      const centerX = Math.cos(baseAngle) * runeDistance;
      const centerZ = Math.sin(baseAngle) * runeDistance;
      const centerY = this.chamberHeight - 3;
      
      const zigzagPoints = [
        new THREE.Vector3(centerX - 2, centerY, centerZ),
        new THREE.Vector3(centerX, centerY + 1, centerZ - 2),
        new THREE.Vector3(centerX + 2, centerY, centerZ),
        new THREE.Vector3(centerX, centerY - 1, centerZ + 2)
      ];
      
      for (let i = 0; i < zigzagPoints.length - 1; i++) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          zigzagPoints[i],
          zigzagPoints[i + 1]
        ]);
        
        const material = new THREE.LineBasicMaterial({
          color: 0x00ff88,
          transparent: true,
          opacity: 0.3
        });
        
        const line = new THREE.Line(geometry, material);
        this.worldRoot.add(line);
        
        this.animatedObjects.push({
          object: line,
          type: 'sigmaRune',
          baseOpacity: 0.3,
          pulseSpeed: 0.8,
          phaseOffset: Math.random() * Math.PI * 2
        });
      }
    }
  }
  
  createWalls() {
    const wallSegments = 12;
    
    for (let i = 0; i < wallSegments; i++) {
      const angle1 = (i / wallSegments) * Math.PI * 2;
      const angle2 = ((i + 1) / wallSegments) * Math.PI * 2;
      
      const points = [
        new THREE.Vector3(Math.cos(angle1) * this.chamberRadius, 0, Math.sin(angle1) * this.chamberRadius),
        new THREE.Vector3(Math.cos(angle2) * this.chamberRadius, 0, Math.sin(angle2) * this.chamberRadius),
        new THREE.Vector3(Math.cos(angle2) * this.chamberRadius, this.chamberHeight, Math.sin(angle2) * this.chamberRadius),
        new THREE.Vector3(Math.cos(angle1) * this.chamberRadius, this.chamberHeight, Math.sin(angle1) * this.chamberRadius)
      ];
      
      const wallGeometry = new THREE.BufferGeometry();
      const positions = [];
      
      positions.push(...points[0].toArray());
      positions.push(...points[1].toArray());
      positions.push(...points[2].toArray());
      positions.push(...points[0].toArray());
      positions.push(...points[2].toArray());
      positions.push(...points[3].toArray());
      
      wallGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      wallGeometry.computeVertexNormals();
      
      const wallMaterial = materialRegistry.getStandard('world.sigmariftchamber.wall', {
        color: 0x0d0d1a,
        metalness: 0.3,
        roughness: 0.8,
        side: THREE.DoubleSide
      });
      
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      this.worldRoot.add(wall);
      
      const symbolAngle = (i + 0.5) / wallSegments * Math.PI * 2;
      const symbolX = Math.cos(symbolAngle) * this.chamberRadius;
      const symbolZ = Math.sin(symbolAngle) * this.chamberRadius;
      const symbolY = this.chamberHeight * 0.6;
      
      this.createWallSymbol(symbolX, symbolY, symbolZ, angle1);
    }
    
    const verticalLineCount = 16;
    for (let i = 0; i < verticalLineCount; i++) {
      const angle = (i / verticalLineCount) * Math.PI * 2;
      const x = Math.cos(angle) * this.chamberRadius;
      const z = Math.sin(angle) * this.chamberRadius;
      
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, z),
        new THREE.Vector3(x, this.chamberHeight, z)
      ]);
      
      const material = new THREE.LineBasicMaterial({
        color: 0x00ccdd,
        transparent: true,
        opacity: 0.1
      });
      
      const line = new THREE.Line(geometry, material);
      this.worldRoot.add(line);
    }
  }
  
  createWallSymbol(x, y, z, rotation) {
    const symbolScale = 1.5;
    const trianglePoints = [
      new THREE.Vector3(0, 1, 0).multiplyScalar(symbolScale),
      new THREE.Vector3(-1, -1, 0).multiplyScalar(symbolScale),
      new THREE.Vector3(1, -1, 0).multiplyScalar(symbolScale),
      new THREE.Vector3(0, 1, 0).multiplyScalar(symbolScale)
    ];
    
    trianglePoints.forEach(p => {
      const rotatedX = p.x * Math.cos(rotation) - p.y * Math.sin(rotation);
      const rotatedY = p.x * Math.sin(rotation) + p.y * Math.cos(rotation);
      p.set(x + rotatedX, y + rotatedY, z);
    });
    
    const geometry = new THREE.BufferGeometry().setFromPoints(trianglePoints);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.4
    });
    
    const symbol = new THREE.Line(geometry, material);
    this.worldRoot.add(symbol);
    const wallSymbolEntry = {
      object: symbol,
      type: 'wallSymbol',
      baseOpacity: 0.4,
      pulseSpeed: 0.6,
      phaseOffset: Math.random() * Math.PI * 2,
      flashRadius: Math.sqrt(x * x + z * z),
      flashActive: false,
      flashProgress: 0
    };
    this.animatedObjects.push(wallSymbolEntry);
    this.wallSymbols.push(wallSymbolEntry);
  }

  createFloor() {
    const floorGeometry = new THREE.CircleGeometry(this.chamberRadius, 64);
    const colorArray = [];
    const positions = floorGeometry.attributes.position.array;
    const innerColor = new THREE.Color(0x0a0a1a);
    const outerColor = new THREE.Color(0x050510);

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const radius = Math.sqrt(x * x + z * z);
      const t = Math.min(radius / this.chamberRadius, 1);
      const vertexColor = innerColor.clone().lerp(outerColor, t);
      colorArray.push(vertexColor.r, vertexColor.g, vertexColor.b);
    }

    floorGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorArray, 3));
    const floorMaterial = materialRegistry.getStandard('world.sigmariftchamber.floor', {
      color: 0xffffff,
      vertexColors: true,
      metalness: 0.2,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.userData = {
      collisionEnabled: true,
      isWalkable: true,
      collisionRole: 'terrain',
      terrainType: 'sigmaFloor'
    };
    this.worldRoot.add(floor);
    this.collisionObjects.push(floor);
    
    const patternRadius = this.chamberRadius * 0.8;
    const hexRadius = 2;
    const hexCount = 8;
    for (let i = 0; i < hexCount; i++) {
      const angle = (i / hexCount) * Math.PI * 2;
      const x = Math.cos(angle) * patternRadius * 0.6;
      const z = Math.sin(angle) * patternRadius * 0.6;
      this.createHexagon(x, 0.01, z, hexRadius, 0x00aa99, 0.3);
    }
    
    const ringCount = 5;
    for (let ring = 1; ring <= ringCount; ring++) {
      const ringRadius = (patternRadius / ringCount) * ring;
      const triangleCount = 3 + ring * 2;
      const activationDelay = ((patternRadius - ringRadius) / patternRadius) * 30;
      
      for (let t = 0; t < triangleCount; t++) {
        const angle = (t / triangleCount) * Math.PI * 2;
        const nextAngle = ((t + 1) / triangleCount) * Math.PI * 2;
        
        const points = [
          new THREE.Vector3(0, 0.01, 0),
          new THREE.Vector3(Math.cos(angle) * ringRadius, 0.01, Math.sin(angle) * ringRadius),
          new THREE.Vector3(Math.cos(nextAngle) * ringRadius, 0.01, Math.sin(nextAngle) * ringRadius),
          new THREE.Vector3(0, 0.01, 0)
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const baseOpacity = 0.15 + (ring * 0.05);
        const material = new THREE.LineBasicMaterial({
          color: 0x00ccdd,
          transparent: true,
          opacity: 0
        });
        
        const triangle = new THREE.Line(geometry, material);
        this.worldRoot.add(triangle);
        this.animatedObjects.push({
          object: triangle,
          type: 'floorPattern',
          baseOpacity: baseOpacity,
          pulseSpeed: 0.3,
          phaseOffset: Math.random() * Math.PI * 2,
          flashRadius: ringRadius,
          flashActive: false,
          flashProgress: 0,
          activationDelay: activationDelay,
          active: false,
          fadeProgress: 0
        });
      }
    }

    const floorDriftCount = 100;
    const driftPositions = [];
    const driftSpeeds = [];
    for (let i = 0; i < floorDriftCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.chamberRadius * 0.9;
      const height = 0.05 + Math.random() * 0.25;
      driftPositions.push(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      driftSpeeds.push(0.02 + Math.random() * 0.02);
    }

    const driftGeometry = new THREE.BufferGeometry();
    driftGeometry.setAttribute('position', new THREE.Float32BufferAttribute(driftPositions, 3));

    const driftMaterial = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x00aa88,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.floorDriftParticles = new THREE.Points(driftGeometry, driftMaterial);
    this.worldRoot.add(this.floorDriftParticles);
    this.floorDriftData = {
      speeds: driftSpeeds
    };
  }
  
  createHexagon(x, y, z, radius, color, opacity) {
    const points = [];
    for (let i = 0; i < 7; i++) {
      const angle = (i / 6) * Math.PI * 2;
      points.push(new THREE.Vector3(x + Math.cos(angle) * radius, y, z + Math.sin(angle) * radius));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0
    });
    
    const hexagon = new THREE.Line(geometry, material);
    this.worldRoot.add(hexagon);
    
    if (Math.random() > 0.5) {
      const activationDelay = ((this.chamberRadius * 0.8 * 0.6 - Math.sqrt(x * x + z * z)) / (this.chamberRadius * 0.8 * 0.6)) * 30;
      this.animatedObjects.push({
        object: hexagon,
        type: 'floorPattern',
        baseOpacity: opacity,
        pulseSpeed: 0.3,
        phaseOffset: Math.random() * Math.PI * 2,
        flashRadius: Math.sqrt(x * x + z * z),
        flashActive: false,
        flashProgress: 0,
        activationDelay: activationDelay,
        active: false,
        fadeProgress: 0
      });
    }
  }
  
  createCentralRift() {
    const riftRadius = 8;
    this.createSigmaRiftCore(riftRadius);
    this.createRiftEdges(riftRadius);
    this.createRiftParticleStream(riftRadius);
    this.createRiftDistortionField(riftRadius);
  }

  createSigmaRiftCore(radius) {
    // Use RiftEnergyShader for Sigma rift
    const geometry = new THREE.CylinderGeometry(radius, radius, this.riftHeight, 32, 32, true);

    // Create Sigma rift material using the shader
    const material = createSigmaRift(geometry, {
      riftColor: 0x00ff88,
      edgeColor: 0x00ddff,
      riftPosition: 0.5,
      riftWidth: 0.15,
      swirl: 0.3,
      voidDensity: 0.6,
      particleThreads: 5,
      scale: 1.0
    });

    this.riftCore = new THREE.Mesh(geometry, material);
    this.riftCore.position.y = this.riftHeight / 2;
    this.worldRoot.add(this.riftCore);

    this.animatedObjects.push({
      object: this.riftCore,
      type: 'riftCore',
      shader: true
    });
  }

  createRiftEye() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(160,255,120,0.9)');
    gradient.addColorStop(0.5, 'rgba(0,255,255,0.6)');
    gradient.addColorStop(0.8, 'rgba(0,255,255,0.15)');
    gradient.addColorStop(1, 'rgba(0,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.48, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.set(0, this.riftHeight / 2, 0);
    sprite.scale.set(12, 12, 1);
    this.worldRoot.add(sprite);
    this.riftEyeSprite = sprite;
  }

  createRiftSurgeWave() {
    const geometry = new THREE.RingGeometry(0, 1, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    ring.visible = false;
    this.worldRoot.add(ring);
    this.riftSurgeWave = ring;
    this.riftSurgeTimer = 10 + Math.random() * 2;
    this.riftSurgeActive = false;
    this.riftSurgeProgress = 0;
  }

  createMonolithShadowMaterial() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0.85)');
    gradient.addColorStop(0.55, 'rgba(0,0,0,0.35)');
    gradient.addColorStop(0.75, 'rgba(0,255,120,0.45)');
    gradient.addColorStop(1, 'rgba(0,255,120,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(0,255,120,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.45, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false
    });
  }

  createRiftEdges(radius) {
    for (let y of [0, this.riftHeight]) {
      const rimGeometry = new THREE.TorusGeometry(radius, 0.3, 16, 32);
      const rimMaterial = materialRegistry.getStandard('world.sigmariftchamber.rim', {
        color: 0x00ffaa,
        emissive: 0x00ffaa,
        emissiveIntensity: 0.8,
        metalness: 0.8,
        roughness: 0.2
      });
      
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.position.y = y;
      rim.rotation.x = Math.PI / 2;
      this.worldRoot.add(rim);
      
      const rimLight = new THREE.PointLight(0x00ffaa, 1, 25);
      rimLight.position.y = y;
      this.worldRoot.add(rimLight);
    }

    const hemisphere = new THREE.HemisphereLight(0x001a0a, 0x000000, 0.15);
    this.scene.add(hemisphere);

    const spot = new THREE.SpotLight(0x00ffaa, 0.8, 100, Math.PI / 6, 0.5, 1);
    spot.position.set(0, this.riftHeight + 20, 0);
    spot.target = this.riftCore;
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.camera.near = 10;
    spot.shadow.camera.far = 100;
    this.scene.add(spot);
    this.scene.add(spot.target);
    
    const verticalLineCount = 16;
    for (let i = 0; i < verticalLineCount; i++) {
      const angle = (i / verticalLineCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const points = [
        new THREE.Vector3(x, 0, z),
        new THREE.Vector3(x, this.riftHeight, z)
      ];
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.6,
        linewidth: 2
      });
      
      const line = new THREE.Line(geometry, material);
      this.worldRoot.add(line);
      
      this.animatedObjects.push({
        object: line,
        type: 'riftEdgeLine',
        pulseSpeed: 1.2,
        phaseOffset: (i / verticalLineCount) * Math.PI * 2
      });
    }
  }
  
  createRiftParticleStream(riftRadius) {
    const particleCount = 500;
    const positions = [];
    const velocities = [];
    const ages = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * riftRadius * 0.8;
      const height = Math.random() * this.riftHeight;
      
      positions.push(Math.cos(angle) * distance, height, Math.sin(angle) * distance);
      
      const direction = Math.random() > 0.5 ? 1 : -1;
      const speed = 2 + Math.random() * 3;
      
      velocities.push(
        Math.cos(angle) * direction * speed,
        (Math.random() - 0.5) * speed,
        Math.sin(angle) * direction * speed
      );
      
      ages.push(Math.random());
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('age', new THREE.Float32BufferAttribute(ages, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.2,
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    this.riftParticles = new THREE.Points(geometry, material);
    this.worldRoot.add(this.riftParticles);
    
    this.riftParticleData = {
      velocities: velocities,
      ages: ages,
      positions: positions,
      maxAge: 3.0
    };
  }
  
  createRiftDistortionField(riftRadius) {
    const ringCount = 4;
    
    for (let r = 1; r <= ringCount; r++) {
      const radius = riftRadius + r * 1.5;
      const ringGeometry = new THREE.TorusGeometry(radius, 0.1, 16, 64);
      
      const vertShader = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
      const fragShader = 'uniform float time; uniform float ringIndex; varying vec2 vUv; void main() { float wave = sin(vUv.x * 10.0 + time * 2.0) * 0.5 + 0.5; float alpha = wave * 0.2 + (0.3 - ringIndex * 0.05); gl_FragColor = vec4(0.0, 1.0, 0.7, alpha); }';
      
      const ringMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          ringIndex: { value: r }
        },
        vertexShader: vertShader,
        fragmentShader: fragShader,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.y = this.riftHeight / 2;
      ring.rotation.x = Math.PI / 2;
      this.worldRoot.add(ring);
      
      this.animatedObjects.push({
        object: ring,
        type: 'distortionRing',
        shader: true
      });
    }
  }
  
  createFloatingMonoliths() {
    const monolithCount = 5;
    
    for (let i = 0; i < monolithCount; i++) {
      const angle = (i / monolithCount) * Math.PI * 2;
      const distance = 20 + Math.random() * 5;
      const height = this.riftHeight * 0.5 + Math.random() * 8;
      
      this.createMonolith(Math.cos(angle) * distance, height, Math.sin(angle) * distance, angle);
    }
  }
  
  createMonolith(x, y, z, angle) {
    const width = 1.2;
    const height = 6 + Math.random() * 3;
    const depth = 0.4;
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = materialRegistry.getStandard('world.sigmariftchamber.monolith', {
      color: 0x1a1a2e,
      emissive: 0x1a1a2e,
      emissiveIntensity: 0.1,
      metalness: 0.7,
      roughness: 0.3
    });
    
    const monolith = new THREE.Mesh(geometry, material);
    monolith.position.set(x, y, z);
    monolith.rotation.y = angle;
    this.worldRoot.add(monolith);
    this.collisionObjects.push(monolith);
    
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
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
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.6
    });
    const edge = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    monolith.add(edge);
    
    if (!this.monolithShadowMaterial) {
      this.monolithShadowMaterial = this.createMonolithShadowMaterial();
    }

    const shadow = new THREE.Sprite(this.monolithShadowMaterial);
    shadow.position.set(x, 0.05, z);
    shadow.scale.set(3 + (height / this.riftHeight) * 4, 3 + (height / this.riftHeight) * 4, 1);
    shadow.renderOrder = 1;
    this.worldRoot.add(shadow);
    this.monolithShadows.push({ sprite: shadow, monolith });

    if (!this.monolithTetherMaterial) {
      this.monolithTetherMaterial = new THREE.LineBasicMaterial({
        color: 0x00ffaa,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
      });
    }

    const tetherGeometry = new THREE.BufferGeometry();
    tetherGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
      monolith.position.x,
      monolith.position.y,
      monolith.position.z,
      0,
      this.riftHeight / 2,
      0
    ], 3));

    const tether = new THREE.Line(tetherGeometry, this.monolithTetherMaterial);
    this.worldRoot.add(tether);
    this.monolithTethers.push({ tether, monolith });
    
    monolith.userData = {
      baseX: x,
      baseZ: z,
      orbitRadius: Math.sqrt(x * x + z * z),
      orbitSpeed: 0.1 + Math.random() * 0.2,
      orbitPhase: angle,
      floatSpeed: 0.4 + Math.random() * 0.2,
      floatOffset: Math.random() * Math.PI * 2,
      collisionEnabled: true,
      collisionRole: 'blocker'
    };
    
    this.animatedObjects.push({
      object: monolith,
      type: 'monolith'
    });
  }

  getCollisionObjects() {
    return this.collisionObjects;
  }

  getGroundLevelAt(x, z) {
    return (this.floor?.position.y ?? 0) + this.playerGroundOffset;
  }

  getMaxStepHeight() {
    return 1.25;
  }

  getMovementBounds() {
    return {
      type: 'circle',
      center: new THREE.Vector3(0, 0, 0),
      radius: Math.max(1, this.chamberRadius - 1.5)
    };
  }
  
  createHolographicRings() {
    const ringCount = 8;
    
    for (let i = 0; i < ringCount; i++) {
      const height = (i / ringCount) * this.chamberHeight;
      const radius = 15 + Math.random() * 10;
      
      const ringGeometry = new THREE.TorusGeometry(radius, 0.15, 8, 64);
      const vertShader = 'varying vec3 vPos; void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
      const fragShader = 'uniform float time; varying vec3 vPos; void main() { float pulse = sin(time * 1.5) * 0.5 + 0.5; gl_FragColor = vec4(0.0, 0.8 + pulse * 0.2, 0.8, 0.3); }';
      
      const ringMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 }
        },
        vertexShader: vertShader,
        fragmentShader: fragShader,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.y = height;
      ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
      ring.rotation.y = Math.random() * Math.PI * 2;
      this.worldRoot.add(ring);
      
      this.animatedObjects.push({
        object: ring,
        type: 'holographicRing',
        shader: true,
        rotationSpeed: this.holographicRingBaseSpeed,
        rotationAxis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        phaseOffset: Math.random() * Math.PI * 2,
        baseOpacity: 0.3
      });
    }
  }
  
  createNeonPaths() {
    const pathCount = 6;
    
    for (let p = 0; p < pathCount; p++) {
      const angle = (p / pathCount) * Math.PI * 2;
      const startDistance = this.chamberRadius * 0.9;
      const endDistance = 10;
      
      const startX = Math.cos(angle) * startDistance;
      const startZ = Math.sin(angle) * startDistance;
      const endX = Math.cos(angle) * endDistance;
      const endZ = Math.sin(angle) * endDistance;
      
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(startX, 0, startZ),
        new THREE.Vector3((startX + endX) * 0.5, this.riftHeight * 0.3, (startZ + endZ) * 0.5),
        new THREE.Vector3(endX, 0, endZ)
      );
      
      const points = curve.getPoints(30);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x00ccdd,
        transparent: true,
        opacity: 0.4,
        linewidth: 3
      });
      
      const path = new THREE.Line(geometry, material);
      this.worldRoot.add(path);
      
      this.animatedObjects.push({
        object: path,
        type: 'neonPath',
        baseOpacity: 0.4,
        flashRadius: (startDistance + endDistance) * 0.5,
        flashActive: false,
        flashProgress: 0
      });
      
      this.createPathParticles(curve);
    }
  }
  
  createPathParticles(curve) {
    const particleCount = 10;
    const positions = [];
    
    for (let i = 0; i < particleCount; i++) {
      const point = curve.getPoint(i / particleCount);
      positions.push(point.x, point.y, point.z);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.25,
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    this.worldRoot.add(particles);
    
    const pathBaseSpeed = 1.2 + Math.random() * 0.5;
    this.animatedObjects.push({
      object: particles,
      type: 'pathParticles',
      curve: curve,
      baseSpeed: pathBaseSpeed,
      speed: pathBaseSpeed
    });
  }
  
  createParticleDrift() {
    const particleCount = 300;
    const positions = [];
    const colors = [];
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.chamberRadius;
      
      positions.push(Math.cos(angle) * radius, Math.random() * this.chamberHeight, Math.sin(angle) * radius);
      colors.push(0.1, 0.6 + Math.random() * 0.3, 0.3);
      velocities.push((Math.random() - 0.5) * 0.1, Math.random() * 0.05, (Math.random() - 0.5) * 0.1);
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    
    this.driftParticles = new THREE.Points(geometry, material);
    this.worldRoot.add(this.driftParticles);
    
    this.driftData = {
      velocities: velocities,
      positions: positions
    };
  }
  
  update(deltaTime, time) {
    // Update reference plane (if created via canonical contract)
    if (this.referencePlane && this.referencePlane.animate) {
      this.referencePlane.animate(deltaTime, time);
    }
    if (!this.floorSigilCompleted && !this.floorSigilFlashActive) {
      this.floorSigilElapsed += deltaTime;
    }
    
    this.animatedObjects.forEach(obj => {
      if (obj.type === 'riftCore' && obj.object.material.uniforms) {
        // Use RiftEnergyShader update function
        updateRiftEnergyTime(obj.object.material, deltaTime);
      }
      
      if (obj.type === 'distortionRing' && obj.object.material.uniforms) {
        obj.object.material.uniforms.time.value = time;
      }
      
      if (obj.type === 'holographicRing') {
        if (obj.object.material.uniforms) {
          obj.object.material.uniforms.time.value = time;
        }
        const axis = obj.rotationAxis;
        obj.object.rotateOnWorldAxis(axis, obj.rotationSpeed * deltaTime);
        if (!this.holographicPulseActive) {
          obj.object.material.opacity = obj.baseOpacity;
        }
      }
      
      if ((obj.type === 'sigmaRune' || obj.type === 'wallSymbol') && obj.baseOpacity !== undefined) {
        const pulse = Math.sin(time * obj.pulseSpeed + obj.phaseOffset) * 0.5 + 0.5;
        if (!obj.flashActive) {
          obj.object.material.opacity = obj.baseOpacity * (0.5 + pulse * 0.5);
          if (obj.type === 'wallSymbol' && obj.object.material.color) {
            obj.object.material.color.setHex(0x00ff88);
          }
        }
      }
      
      if (obj.type === 'floorPattern' && obj.baseOpacity !== undefined) {
        if (!this.floorSigilCompleted) {
          if (!obj.active && this.floorSigilElapsed >= obj.activationDelay) {
            obj.active = true;
            obj.fadeProgress = 0;
          }
          if (obj.active && !this.floorSigilFlashActive) {
            obj.fadeProgress += deltaTime;
            obj.object.material.opacity = Math.min(obj.baseOpacity, obj.baseOpacity * (obj.fadeProgress / 2));
          }
        } else {
          if (!obj.flashActive) {
            const pulse = Math.sin(time * obj.pulseSpeed + obj.phaseOffset) * 0.5 + 0.5;
            obj.object.material.opacity = obj.baseOpacity * (0.5 + pulse * 0.5);
          }
        }
      }
      
      if (obj.type === 'riftEdgeLine') {
        const pulse = Math.sin(time * obj.pulseSpeed + obj.phaseOffset) * 0.5 + 0.5;
        obj.object.material.opacity = 0.3 + pulse * 0.3;
      }
      
      if (obj.type === 'monolith') {
        const data = obj.object.userData;
        const speedMultiplier = this.runeSequencePhase === 1 ? 1.8 : 1.0;
        const orbitPhase = time * data.orbitSpeed * speedMultiplier + data.orbitPhase;
        obj.object.position.x = Math.cos(orbitPhase) * data.orbitRadius;
        obj.object.position.z = Math.sin(orbitPhase) * data.orbitRadius;
        const floatPhase = time * data.floatSpeed + data.floatOffset;
        obj.object.position.y += Math.sin(floatPhase) * deltaTime * 0.5;
        if (this.camera) {
          obj.object.lookAt(this.camera.position);
        }
      }
      
      if (obj.type === 'pathParticles') {
        const speedMultiplier = this.pathBurstActive ? 3.0 : 1.0;
        obj.speed = obj.baseSpeed * speedMultiplier;
        if (obj.object.material && obj.object.material.color) {
          obj.object.material.color.setHex(this.pathBurstActive ? 0x00ff88 : 0x00ffcc);
        }
        const t = (time * obj.speed) % 1.0;
        const positions = obj.object.geometry.attributes.position.array;
        for (let i = 0; i < positions.length / 3; i++) {
          const pathT = (i / (positions.length / 3) + t) % 1.0;
          const point = obj.curve.getPoint(pathT);
          positions[i * 3] = point.x;
          positions[i * 3 + 1] = point.y;
          positions[i * 3 + 2] = point.z;
        }
        obj.object.geometry.attributes.position.needsUpdate = true;
      }
    });

    if (this.riftEyeSprite) {
      if (this.camera) {
        this.riftEyeSprite.lookAt(this.camera.position);
      }
      this.riftEyeTimer -= deltaTime;
      if (!this.riftEyeActive && this.riftEyeTimer <= 0) {
        this.riftEyeActive = true;
        this.riftEyeProgress = 0;
        this.riftEyeTimer = 15 + Math.random() * 4;
      }
      if (this.riftEyeActive) {
        this.riftEyeProgress += deltaTime;
        const duration = 3.0;
        const t = Math.min(this.riftEyeProgress / duration, 1);
        const fade = t < 0.5 ? t * 2 : Math.max(0, 1 - (t - 0.5) * 2);
        this.riftEyeSprite.material.opacity = 0.3 * fade;
        if (this.riftEyeProgress >= duration) {
          this.riftEyeActive = false;
          this.riftEyeProgress = 0;
          this.riftEyeSprite.material.opacity = 0;
        }
      }
    }

    if (this.runeSequencePhase === 0) {
      this.runeSequenceTimer -= deltaTime;
      if (this.runeSequenceTimer <= 0) {
        this.runeSequencePhase = 1;
        this.runeSequenceProgress = 0;
      }
    }

    if (this.runeSequencePhase === 1) {
      this.runeSequenceProgress += deltaTime;
      const symbolDelay = 0.3;
      const activeDuration = 0.5;
      const finalFlashDuration = 0.4;
      const wallCount = this.wallSymbols.length;
      const totalDuration = (wallCount - 1) * symbolDelay + activeDuration + finalFlashDuration;
      const finalFlashStart = (wallCount - 1) * symbolDelay + activeDuration;

      this.wallSymbols.forEach((entry, index) => {
        const localTime = this.runeSequenceProgress - index * symbolDelay;
        if (localTime >= 0 && localTime < activeDuration) {
          entry.object.material.opacity = 1.0;
          entry.object.material.color.setHex(0x00ff88);
        } else if (localTime >= activeDuration && localTime < activeDuration + 0.2) {
          const fade = 1 - (localTime - activeDuration) / 0.2;
          entry.object.material.opacity = Math.max(entry.baseOpacity, 0.2) * fade + entry.baseOpacity * (1 - fade);
        } else if (this.runeSequenceProgress >= finalFlashStart) {
          entry.object.material.opacity = 1.0;
          entry.object.material.color.setHex(0x00ff88);
        } else {
          entry.object.material.opacity = entry.baseOpacity;
        }
      });

      if (this.runeSequenceProgress >= totalDuration) {
        this.runeSequencePhase = 0;
        this.runeSequenceTimer = 20 + Math.random() * 3;
        this.runeSequenceProgress = 0;
        this.wallSymbols.forEach(entry => {
          entry.object.material.opacity = entry.baseOpacity;
        });
      }
    }

    if (!this.floorSigilCompleted && this.floorSigilElapsed >= 30 && !this.floorSigilFlashActive) {
      this.floorSigilFlashActive = true;
      this.floorSigilFlashProgress = 0;
      this.animatedObjects.forEach(obj => {
        if (obj.type === 'floorPattern') {
          obj.object.material.opacity = 1.0;
        }
      });
    }

    if (this.floorSigilFlashActive) {
      this.floorSigilFlashProgress += deltaTime;
      if (this.floorSigilFlashProgress >= 0.4) {
        this.floorSigilFlashActive = false;
        this.floorSigilCompleted = true;
        this.floorSigilFlashProgress = 0;
        this.animatedObjects.forEach(obj => {
          if (obj.type === 'floorPattern') {
            obj.object.material.opacity = obj.baseOpacity;
          }
        });
      }
    }

    this.pathBurstTimer -= deltaTime;
    if (!this.pathBurstActive && this.pathBurstTimer <= 0) {
      this.pathBurstActive = true;
      this.pathBurstProgress = 0;
    }

    if (this.pathBurstActive) {
      this.pathBurstProgress += deltaTime;
      const burstDuration = 0.8;
      if (this.pathBurstProgress >= burstDuration) {
        this.pathBurstActive = false;
        this.pathBurstTimer = 6 + Math.random() * 2;
        this.pathBurstProgress = 0;
      }
    }

    if (this.holographicPulseTimer !== undefined) {
      this.holographicPulseTimer -= deltaTime;
      if (!this.holographicPulseActive && this.holographicPulseTimer <= 0) {
        this.holographicPulseActive = true;
        this.holographicPulseProgress = 0;
      }

      if (this.holographicPulseActive) {
        this.holographicPulseProgress += deltaTime;
        const pulseDuration = 0.5;
        const half = pulseDuration * 0.5;
        const progress = Math.min(this.holographicPulseProgress, pulseDuration);
        const t = progress < half ? progress / half : 1 - (progress - half) / half;
        const opacity = 0.3 + (0.8 - 0.3) * t;
        this.animatedObjects.forEach(obj => {
          if (obj.type === 'holographicRing') {
            obj.object.material.opacity = opacity;
          }
        });
        if (this.holographicPulseProgress >= pulseDuration) {
          this.holographicPulseActive = false;
          this.holographicPulseProgress = 0;
          this.holographicPulseTimer = 5 + Math.random() * 1.5;
          this.animatedObjects.forEach(obj => {
            if (obj.type === 'holographicRing') {
              obj.object.material.opacity = obj.baseOpacity;
            }
          });
        }
      }
    }

    if (this.riftSurgeWave) {
      this.riftSurgeTimer -= deltaTime;
      if (!this.riftSurgeActive && this.riftSurgeTimer <= 0) {
        this.riftSurgeActive = true;
        this.riftSurgeProgress = 0;
        this.riftSurgeWave.visible = true;
        this.riftSurgeWave.scale.set(1, 1, 1);
      }

      if (this.riftSurgeActive) {
        this.riftSurgeProgress += deltaTime;
        const duration = 2.0;
        const t = Math.min(this.riftSurgeProgress / duration, 1);
        const radius = 1 + t * (this.chamberRadius - 1);
        this.riftSurgeWave.scale.set(radius, radius, 1);
        this.riftSurgeWave.material.opacity = 0.5 * (1 - t);

        const flashThreshold = 2.5;
        this.animatedObjects.forEach(obj => {
          if ((obj.type === 'neonPath' || obj.type === 'wallSymbol' || obj.type === 'floorPattern') && obj.flashRadius !== undefined) {
            const distanceDelta = Math.abs(obj.flashRadius - radius);
            if (!obj.flashActive && distanceDelta < flashThreshold) {
              obj.flashActive = true;
              obj.flashProgress = 0;
            }

            if (obj.flashActive) {
              obj.flashProgress += deltaTime;
              const flashDuration = 0.2;
              const fade = Math.max(0, 1 - obj.flashProgress / flashDuration);
              obj.object.material.opacity = obj.baseOpacity + (1 - obj.baseOpacity) * fade;
              if (obj.flashProgress >= flashDuration) {
                obj.flashActive = false;
                obj.object.material.opacity = obj.baseOpacity;
              }
            }
          }
        });

        if (this.riftSurgeProgress >= duration) {
          this.riftSurgeActive = false;
          this.riftSurgeProgress = 0;
          this.riftSurgeWave.visible = false;
          this.riftSurgeTimer = 10 + Math.random() * 2;
        }
      }
    }
    
    if (this.riftParticles && this.riftParticleData) {
      const positions = this.riftParticles.geometry.attributes.position.array;
      const velocities = this.riftParticleData.velocities;
      const ages = this.riftParticles.geometry.attributes.age.array;
      const maxAge = this.riftParticleData.maxAge;
      const particleSpeedBoost = this.runeSequencePhase === 1 ? 2.0 : 1.0;
      
      for (let i = 0; i < positions.length / 3; i++) {
        ages[i] += deltaTime / maxAge;
        
        if (ages[i] >= 1.0) {
          ages[i] = 0;
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 8;
          const height = Math.random() * this.riftHeight;
          positions[i * 3] = Math.cos(angle) * distance;
          positions[i * 3 + 1] = height;
          positions[i * 3 + 2] = Math.sin(angle) * distance;
        } else {
          positions[i * 3] += velocities[i * 3] * deltaTime;
          positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaTime;
          positions[i * 3 + 2] += velocities[i * 3 + 2] * deltaTime;
        }
      }
      
      this.riftParticles.geometry.attributes.position.needsUpdate = true;
      this.riftParticles.geometry.attributes.age.needsUpdate = true;
    }
    
    if (this.driftParticles && this.driftData) {
      const positions = this.driftParticles.geometry.attributes.position.array;
      const velocities = this.driftData.velocities;
      
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] += velocities[i * 3] * deltaTime * 5;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaTime * 5;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * deltaTime * 5;
        
        const distance = Math.sqrt(positions[i * 3] * positions[i * 3] + positions[i * 3 + 2] * positions[i * 3 + 2]);
        
        if (distance > this.chamberRadius || positions[i * 3 + 1] > this.chamberHeight || positions[i * 3 + 1] < 0) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * this.chamberRadius;
          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 1] = Math.random() * this.chamberHeight;
          positions[i * 3 + 2] = Math.sin(angle) * radius;
        }
      }
      
      this.driftParticles.geometry.attributes.position.needsUpdate = true;
    }

    if (this.floorDriftParticles && this.floorDriftData) {
      const positions = this.floorDriftParticles.geometry.attributes.position.array;
      const speeds = this.floorDriftData.speeds;
      
      for (let i = 0; i < positions.length / 3; i++) {
        const xIndex = i * 3;
        const zIndex = i * 3 + 2;
        const dx = -positions[xIndex];
        const dz = -positions[zIndex];
        const distance = Math.sqrt(dx * dx + dz * dz) + 0.0001;
        const speed = speeds[i] * deltaTime;
        positions[xIndex] += (dx / distance) * speed;
        positions[zIndex] += (dz / distance) * speed;

        if (distance < 0.5) {
          const angle = Math.random() * Math.PI * 2;
          const radius = this.chamberRadius * 0.9;
          positions[xIndex] = Math.cos(angle) * radius;
          positions[xIndex + 1] = 0.05 + Math.random() * 0.25;
          positions[zIndex] = Math.sin(angle) * radius;
          speeds[i] = 0.02 + Math.random() * 0.02;
        }
      }
      
      this.floorDriftParticles.geometry.attributes.position.needsUpdate = true;
    }

    if (this.monolithShadows.length) {
      this.monolithShadows.forEach(entry => {
        const monolith = entry.monolith;
        const shadow = entry.sprite;
        shadow.position.x = monolith.position.x;
        shadow.position.z = monolith.position.z;
        shadow.position.y = 0.05;
        const scale = 3 + (monolith.position.y / this.riftHeight) * 4;
        shadow.scale.set(scale, scale, 1);
        if (this.camera) {
          shadow.lookAt(this.camera.position);
        }
      });
    }

    if (this.monolithTethers.length) {
      const surgeGlow = this.riftSurgeActive ? 0.15 + 0.15 * (1 - Math.abs(this.riftSurgeProgress - 1.0)) : 0.15;
      if (this.monolithTetherMaterial) {
        this.monolithTetherMaterial.opacity = surgeGlow;
      }
      this.monolithTethers.forEach(entry => {
        const positions = entry.tether.geometry.attributes.position.array;
        positions[0] = entry.monolith.position.x;
        positions[1] = entry.monolith.position.y;
        positions[2] = entry.monolith.position.z;
        positions[3] = 0;
        positions[4] = this.riftHeight / 2;
        positions[5] = 0;
        entry.tether.geometry.attributes.position.needsUpdate = true;
      });
    }
    
    if (this.starfield && this.starfieldData) {
      const positions = this.starfield.geometry.attributes.position.array;
      const velocities = this.starfieldData.velocities;
      const topY = this.starfieldData.topY;
      const spawnRadius = this.starfieldData.spawnRadius;
      const minDistance = this.starfieldData.minDistance;

      for (let i = 0; i < positions.length / 3; i++) {
        const xIndex = i * 3;
        const zIndex = i * 3 + 2;

        positions[xIndex] += velocities[i * 2] * deltaTime;
        positions[zIndex] += velocities[i * 2 + 1] * deltaTime;
        positions[xIndex + 1] = topY;

        const currentDistance = Math.sqrt(
          positions[xIndex] * positions[xIndex] +
          positions[zIndex] * positions[zIndex]
        );

        if (currentDistance < minDistance) {
          const angle = Math.random() * Math.PI * 2;
          const radius = spawnRadius * (0.9 + Math.random() * 0.1);
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          positions[xIndex] = x;
          positions[zIndex] = z;
          positions[xIndex + 1] = topY + (Math.random() - 0.5) * 0.3;

          const dirX = -x;
          const dirZ = -z;
          const length = Math.sqrt(dirX * dirX + dirZ * dirZ) + 0.0001;
          const speed = 0.03 + Math.random() * 0.02;
          velocities[i * 2] = (dirX / length) * speed;
          velocities[i * 2 + 1] = (dirZ / length) * speed;
        }
      }

      this.starfield.geometry.attributes.position.needsUpdate = true;
    }
  }
}
