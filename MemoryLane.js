import * as THREE from 'three';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';

/**
 * Memory Lane - AI Data Centre Hub
 * Central hall layout with rotating core, multi-level galleries, and organic server clusters
 */
export class MemoryLane {
  constructor(scene, worldRoot) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.serverTowers = [];
    this.serverClusters = [];
    this.coolingTowers = [];
    this.dataCables = [];
    this.coreStalk = null;
    this.coreRings = [];
    this.galleries = [];
    this.ceilingPanels = [];
    this.ceilingLattice = [];
    this.dataDisplays = [];
    this.dataStreams = [];
    this.memoryCrystals = [];
    this.hallBeams = [];
    this.zoneFogLayers = [];
    this.holograms = [];
    this.memoryShards = [];
    this.glitchWalls = [];
    this.neonStrips = [];
    this.arcs = [];
    this.particles = null;
    this.playerGroundOffset = 1;
    
    // Hall dimensions
    this.hallSize = 96; // 96m hall footprint
    this.hallHeight = 18; // 18m ceiling height

    this.createFloor();
    this.createFloorNeonStrips();
    this.createCentralCore();
    this.createServerClusters();
    this.createCoolingTowers();
    this.createGalleries();
    this.createCeiling();
    this.createDataCables();
    this.createWalls();
    this.createFloatingHolograms();
    this.createMemoryShards();
    this.createParticleDrift();
    this.createHolographicArcs();
    this.createVolumetricFog();
  }
  
  /**
   * Create dark reflective circular floor
   */
  createFloor() {
    const floorGeometry = new THREE.CircleGeometry(this.hallSize / 2, 64);
    const floorMaterial = materialRegistry.getStandard('world.memorylane.floor', {
      color: 0x090b14,
      roughness: 0.18,
      metalness: 0.86,
      emissive: 0x050816,
      emissiveIntensity: 0.08
    });
    
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = 0;
    this.worldRoot.add(this.floor);
    
    // Add circular neon ring around floor edge
    const ringGeometry = new THREE.TorusGeometry(this.hallSize / 2 - 0.5, 0.15, 16, 64);
    const ringMaterial = materialRegistry.getBasic('world.memorylane.floorRing', {
      color: 0x00ddff,
      emissive: 0x00ddff,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.55
    });
    
    this.floorRing = new THREE.Mesh(ringGeometry, ringMaterial);
    this.floorRing.rotation.x = Math.PI / 2;
    this.floorRing.position.y = 0.05;
    this.floorRing.userData = { pulseOffset: 0 };
    this.worldRoot.add(this.floorRing);
    
    // Add floor data patterns (concentric circles)
    for (let i = 1; i <= 5; i++) {
      const radius = (this.hallSize / 2) * (i / 6);
      const dataRingGeo = new THREE.RingGeometry(radius - 0.05, radius + 0.05, 64);
      const dataRingMat = materialRegistry.getBasic('world.memorylane.dataRing', {
        color: 0x123b66,
        transparent: true,
        opacity: 0.11
      });
      
      const dataRing = new THREE.Mesh(dataRingGeo, dataRingMat);
      dataRing.rotation.x = -Math.PI / 2;
      dataRing.position.y = 0.02;
      this.worldRoot.add(dataRing);
    }
  }

  getGroundLevelAt(x, z) {
    const radius = Math.sqrt(x * x + z * z);
    const smooth = (edge0, edge1, value) => {
      const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    };

    const terrace1 = smooth(13, 19, radius) * (1 - smooth(20, 24, radius)) * 2.5;
    const terrace2 = smooth(22, 29, radius) * (1 - smooth(31, 35, radius)) * 5.4;
    const terrace3 = smooth(33, 40, radius) * (1 - smooth(42, 46, radius)) * 8.4;
    const floorRipple = Math.sin(radius * 0.12 + x * 0.04) * 0.08;

    return (this.floor?.position.y ?? 0) + this.playerGroundOffset + terrace1 + terrace2 + terrace3 + floorRipple;
  }

  getMaxStepHeight() {
    return 2.4;
  }
  
  /**
   * Create central rotating core stalk
   */
  createCentralCore() {
    const coreY = this.hallHeight / 2 + 0.5;

    const stalkGeo = new THREE.CylinderGeometry(4.3, 5.2, this.hallHeight - 2, 32, 1, false);
    const stalkMat = materialRegistry.getStandard('world.memorylane.coreStalk', {
      color: 0x141425,
      roughness: 0.24,
      metalness: 0.88,
      emissive: 0x13001d,
      emissiveIntensity: 0.25
    });

    this.coreStalk = new THREE.Mesh(stalkGeo, stalkMat);
    this.coreStalk.position.set(0, coreY, 0);
    this.coreStalk.userData = {
      rotationSpeed: 0.0009,
      pulseOffset: 0
    };
    this.worldRoot.add(this.coreStalk);

    const shellGeo = new THREE.CylinderGeometry(7.5, 8.3, this.hallHeight - 1.2, 40, 1, true);
    const shellMat = materialRegistry.getBasic('world.memorylane.coreShell', {
      color: 0x00d5ff,
      transparent: true,
      opacity: 0.10,
      emissive: 0x00b8ff,
      emissiveIntensity: 0.6,
      side: THREE.DoubleSide
    });
    this.coreShell = new THREE.Mesh(shellGeo, shellMat);
    this.coreShell.position.set(0, coreY, 0);
    this.worldRoot.add(this.coreShell);

    const innerCoreGeo = new THREE.SphereGeometry(2.7, 32, 32);
    const innerCoreMat = materialRegistry.getBasic('world.memorylane.innerCore', {
      color: 0xffffff,
      emissive: 0x8ad8ff,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.92
    });
    this.innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    this.innerCore.position.set(0, coreY, 0);
    this.innerCore.userData = {
      pulseSpeed: 1.2,
      pulseOffset: 0
    };
    this.worldRoot.add(this.innerCore);

    const ringConfigs = [
      { y: coreY - 2.5, radius: 6.8, thickness: 0.42, color: 0x00ddff, speed: 0.0022 },
      { y: coreY + 1.8, radius: 8.3, thickness: 0.5, color: 0x8800ff, speed: -0.0018 },
      { y: coreY + 5.6, radius: 9.4, thickness: 0.62, color: 0xff0088, speed: 0.0012 }
    ];

    ringConfigs.forEach(config => {
      const ringGeo = new THREE.TorusGeometry(config.radius, config.thickness, 18, 80);
      const ringMat = materialRegistry.getBasic('world.memorylane.coreRing', {
        color: config.color,
        emissive: config.color,
        emissiveIntensity: 0.65,
        transparent: true,
        opacity: 0.6
      });

      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, config.y, 0);
      ring.rotation.x = Math.PI / 2;
      ring.userData = {
        rotationSpeed: config.speed,
        pulseOffset: Math.random() * Math.PI * 2
      };

      this.worldRoot.add(ring);
      this.coreRings.push(ring);
    });

    const activityColumnGeo = new THREE.CylinderGeometry(1.1, 1.4, this.hallHeight - 1, 16, 1, true);
    const activityColumnMat = materialRegistry.getBasic('world.memorylane.coreActivity', {
      color: 0x00ddff,
      transparent: true,
      opacity: 0.16,
      emissive: 0x00ddff,
      emissiveIntensity: 0.9,
      side: THREE.DoubleSide
    });
    const activityColumn = new THREE.Mesh(activityColumnGeo, activityColumnMat);
    activityColumn.position.set(0, coreY, 0);
    this.worldRoot.add(activityColumn);
    this.coreActivityColumn = activityColumn;

    const coreLight = new THREE.PointLight(0x00bbff, 1.1, 38, 2);
    coreLight.position.set(0, coreY, 0);
    this.coreLight = coreLight;
    this.worldRoot.add(coreLight);
  }
  
  /**
   * Create organic server clusters
   */
  createServerClusters() {
    const clusterAnchors = [
      { x: -28, z: -10, count: 4 },
      { x: -12, z: 24, count: 5 },
      { x: 18, z: 28, count: 4 },
      { x: 30, z: -4, count: 5 },
      { x: 12, z: -28, count: 4 },
      { x: -24, z: -28, count: 3 },
      { x: 4, z: 18, count: 4 },
      { x: -4, z: -18, count: 4 }
    ];

    clusterAnchors.forEach((anchor, index) => {
      this.createServerCluster(anchor.x, anchor.z, index, anchor.count);
    });

    const nodePositions = [
      [-22, 6], [-18, -2], [-4, 12], [8, -8], [20, 4], [26, 18],
      [-14, 30], [6, 32], [34, 10], [-30, 16]
    ];
    nodePositions.forEach(([x, z]) => this.createDataNode(x, z));
  }
  
  /**
   * Create a server cluster (group of 3-5 towers)
   */
  createServerCluster(baseX, baseZ, clusterIndex, towerCount = 4) {
    const towersInCluster = towerCount;
    
    for (let i = 0; i < towersInCluster; i++) {
      // Vary tower size: 2m to 8m
      const size = 2 + Math.random() * 6;
      const height = 5 + Math.random() * 10;
      
      // Offset from cluster center
      const offsetX = (Math.random() - 0.5) * 9;
      const offsetZ = (Math.random() - 0.5) * 9;
      
      const x = baseX + offsetX;
      const z = baseZ + offsetZ;
      
      this.createServerTower(x, z, size, height, clusterIndex);
    }
  }
  
  /**
   * Create individual server tower with varied size
   */
  createServerTower(x, z, size, height, clusterIndex) {
    const towerGroup = new THREE.Group();
    
    // Main tower body
    const towerGeometry = new THREE.BoxGeometry(size, height, size * 0.7);
    const towerMaterial = materialRegistry.getStandard('world.memorylane.tower', {
      color: 0x10101c,
      roughness: 0.28,
      metalness: 0.9,
      emissive: 0x0a1022,
      emissiveIntensity: 0.12
    });
    
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = height / 2;
    towerGroup.add(tower);
    
    // Neon outline edges
    const edgeGeometry = new THREE.EdgesGeometry(towerGeometry);
    const pos = edgeGeometry.attributes?.position?.array;
    if (pos) {
      for (let i = 0; i < pos.length; i++) {
        if (!Number.isFinite(pos[i])) {
          console.error('[GeometrySource] NaN created in EdgesGeometry', edgeGeometry);
          break;
        }
      }
    }
    
    // Color varies by cluster
    const clusterColors = [0x00ddff, 0x0066ff, 0x8f5dff, 0xff0088, 0x00ff99, 0xffaa00];
    const edgeColor = clusterColors[clusterIndex % clusterColors.length];
    
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: edgeColor,
      transparent: true,
      opacity: 0.5
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.position.y = height / 2;
    edges.userData = { pulseOffset: Math.random() * Math.PI * 2 };
    towerGroup.add(edges);
    
    // Server panels (proportional to tower height)
    const panelCount = Math.floor(height / 2.5);
    for (let i = 0; i < panelCount; i++) {
      const panelY = 1.5 + i * 2.5;
      
      // Status light
      const lightColor = i % 4 === 0 ? edgeColor : i % 4 === 1 ? 0x66ccff : i % 4 === 2 ? 0xff55bb : 0x555577;
      const lightGeometry = new THREE.BoxGeometry(size * 0.08, 0.12, size * 0.6);
      const lightMaterial = materialRegistry.getBasic('world.memorylane.towerLight', {
        color: lightColor,
        transparent: true,
        opacity: 0.58,
        emissive: lightColor,
        emissiveIntensity: 0.42
      });
      
      // Add lights on all 4 sides
      const sides = [
        { x: size / 2 + 0.05, z: 0 },
        { x: -size / 2 - 0.05, z: 0 },
        { x: 0, z: (size * 0.75) / 2 + 0.05 },
        { x: 0, z: -(size * 0.75) / 2 - 0.05 }
      ];
      
      sides.forEach(side => {
        const light = new THREE.Mesh(lightGeometry, lightMaterial.clone());
        light.position.set(side.x, panelY, side.z);
        light.userData = { 
          pulseOffset: Math.random() * Math.PI * 2,
          baseColor: lightColor 
        };
        towerGroup.add(light);
      });
    }
    
    // Rim light for larger towers
    if (size > 4) {
      const rimLight = new THREE.PointLight(edgeColor, 0.32, size * 2.2, 2);
      rimLight.position.set(0, height / 2, 0);
      towerGroup.add(rimLight);
      towerGroup.userData.rimLight = rimLight;
    }
    
    towerGroup.position.set(x, 0, z);
    towerGroup.userData = {
      pulseOffset: Math.random() * Math.PI * 2,
      edges: edges,
      clusterIndex: clusterIndex,
      anchorY: height * 0.78
    };
    
    this.worldRoot.add(towerGroup);
    this.serverTowers.push(towerGroup);
    this.serverClusters.push(towerGroup);
  }
  
  /**
   * Create small data node (2m size)
   */
  createDataNode(x, z) {
    const size = 2;
    const height = 2.6 + Math.random() * 2.4;
    
    const nodeGeometry = new THREE.CylinderGeometry(size / 2, size / 2, height, 8, 1, false);
    const nodeMaterial = materialRegistry.getStandard('world.memorylane.dataNode', {
      color: 0x151522,
      roughness: 0.34,
      metalness: 0.82,
      emissive: 0x100021,
      emissiveIntensity: 0.18
    });
    
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    node.position.set(x, height / 2, z);
    
    // Horizontal ring around node
    const ringGeo = new THREE.TorusGeometry(size / 2 + 0.2, 0.08, 8, 32);
    const ringMat = materialRegistry.getBasic('world.memorylane.nodeRing', {
      color: 0x0066ff,
      emissive: 0x0066ff,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.55
    });
    
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = height / 2;
    node.add(ring);
    
    node.userData = {
      pulseOffset: Math.random() * Math.PI * 2,
      ring: ring,
      anchorY: height * 0.82
    };
    
    this.worldRoot.add(node);
    this.serverClusters.push(node);
  }
  
  /**
   * Create cooling towers with flowing liquid effect
   */
  createCoolingTowers() {
    const towerCount = 8;
    const coolingRadius = 35;
    
    for (let i = 0; i < towerCount; i++) {
      const angle = (i / towerCount) * Math.PI * 2 + Math.PI / towerCount;
      const x = Math.cos(angle) * coolingRadius;
      const z = Math.sin(angle) * coolingRadius;
      
      this.createCoolingTower(x, z, i);
    }
  }
  
  /**
   * Create individual cooling tower
   */
  createCoolingTower(x, z, index) {
    const towerHeight = 12 + Math.random() * 4;
    const towerRadius = 2.5 + Math.random();
    
    // Glass cylinder
    const glassGeometry = new THREE.CylinderGeometry(towerRadius, towerRadius * 0.8, towerHeight, 32, 1, false);
    const glassMaterial = materialRegistry.getStandard('world.memorylane.coolingGlass', {
      color: 0x003366,
      roughness: 0.05,
      metalness: 0.9,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(x, towerHeight / 2, z);
    this.worldRoot.add(glass);
    
    // Inner glowing liquid
    const liquidGeometry = new THREE.CylinderGeometry(towerRadius * 0.7, towerRadius * 0.6, towerHeight * 0.9, 32, 1, false);
    const liquidMaterial = materialRegistry.getBasic('world.memorylane.coolingLiquid', {
      color: 0x00aaff,
      emissive: 0x00aaff,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.6
    });
    
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquid.position.set(x, towerHeight / 2, z);
    liquid.userData = {
      pulseSpeed: 1.0 + Math.random() * 0.5,
      pulseOffset: Math.random() * Math.PI * 2
    };
    this.worldRoot.add(liquid);
    
    // Top cap with light
    const capGeometry = new THREE.CylinderGeometry(towerRadius * 0.9, towerRadius, 0.5, 32, 1, false);
    const capMaterial = materialRegistry.getStandard('world.memorylane.coolingCap', {
      color: 0x222233,
      roughness: 0.4,
      metalness: 0.8
    });
    
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.set(x, towerHeight, z);
    this.worldRoot.add(cap);
    
    // Point light from top
    const light = new THREE.PointLight(0x00aaff, 0.8, 15, 2);
    light.position.set(x, towerHeight + 1, z);
    this.worldRoot.add(light);
    
    // Store for animation
    this.coolingTowers.push({
      glass,
      liquid,
      x,
      z,
      index
    });
  }

  /**
   * Create multi-level ring galleries around the core
   */
  createGalleries() {
    const galleryConfigs = [
      { radius: 18, y: 2.6, thickness: 1.7, color: 0x14203a, emissive: 0x0066ff, opacity: 0.88 },
      { radius: 28, y: 5.6, thickness: 1.55, color: 0x1d1533, emissive: 0x8a44ff, opacity: 0.82 },
      { radius: 38, y: 8.7, thickness: 1.35, color: 0x25143d, emissive: 0xff0088, opacity: 0.76 }
    ];

    galleryConfigs.forEach((config, index) => {
      const ringGeo = new THREE.TorusGeometry(config.radius, config.thickness, 16, 120);
      const ringMat = materialRegistry.getStandard('world.memorylane.gallery', {
        color: config.color,
        roughness: 0.46,
        metalness: 0.68,
        emissive: config.emissive,
        emissiveIntensity: 0.16,
        transparent: true,
        opacity: config.opacity
      });

      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = config.y;
      ring.userData = {
        rotationSpeed: index % 2 === 0 ? 0.0003 : -0.00025,
        pulseOffset: Math.random() * Math.PI * 2
      };
      this.worldRoot.add(ring);
      this.galleries.push(ring);

      for (let s = 0; s < 8; s++) {
        const angle = (s / 8) * Math.PI * 2 + index * 0.2;
        const cx = Math.cos(angle) * config.radius;
        const cz = Math.sin(angle) * config.radius;
        const platformGeo = new THREE.BoxGeometry(4.6, 0.45, 8.2);
        const platformMat = materialRegistry.getStandard('world.memorylane.galleryPlatform', {
          color: config.color,
          roughness: 0.5,
          metalness: 0.62,
          emissive: config.emissive,
          emissiveIntensity: 0.08
        });

        const platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.set(cx, config.y + 0.55, cz);
        platform.rotation.y = -angle + Math.PI / 2;
        platform.scale.x = 1.0 + Math.sin(angle * 3.0) * 0.08;
        platform.scale.z = 1.0 + Math.cos(angle * 2.0) * 0.06;
        platform.userData = {
          pulseOffset: angle,
          baseY: config.y + 0.55
        };
        this.worldRoot.add(platform);
        this.galleries.push(platform);
      }

      const railGeo = new THREE.TorusGeometry(config.radius + 0.8, 0.08, 8, 120);
      const railMat = materialRegistry.getBasic('world.memorylane.galleryRail', {
        color: config.emissive,
        emissive: config.emissive,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.42
      });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.rotation.x = Math.PI / 2;
      rail.position.y = config.y + 1.1;
      rail.userData = { pulseOffset: Math.random() * Math.PI * 2 };
      this.worldRoot.add(rail);
      this.galleries.push(rail);
    });
  }

  /**
   * Create neural ceiling lattice and animated ceiling panels
   */
  createCeiling() {
    const latticeMat = materialRegistry.getBasic('world.memorylane.ceilingLattice', {
      color: 0x4fdfff,
      transparent: true,
      opacity: 0.35,
      emissive: 0x4fdfff,
      emissiveIntensity: 0.12
    });

    const lines = [];
    const step = 12;
    const half = this.hallSize * 0.46;
    for (let i = -3; i <= 3; i++) {
      const x = i * step;
      const z = i * step;
      const h = this.hallHeight - 1.2;
      const vertGeo = new THREE.BoxGeometry(0.12, 0.12, this.hallSize * 0.9);
      const horizGeo = new THREE.BoxGeometry(this.hallSize * 0.9, 0.12, 0.12);

      const vert = new THREE.Mesh(vertGeo, latticeMat.clone());
      vert.position.set(x, h, 0);
      this.worldRoot.add(vert);
      lines.push(vert);

      const horiz = new THREE.Mesh(horizGeo, latticeMat.clone());
      horiz.position.set(0, h, z);
      this.worldRoot.add(horiz);
      lines.push(horiz);
    }
    this.ceilingLattice = lines;

    const panelModes = ['neural', 'streams', 'stats', 'alert'];
    for (let i = 0; i < 10; i++) {
      const width = 6 + Math.random() * 2;
      const height = 3 + Math.random() * 1.5;
      const panelGeo = new THREE.PlaneGeometry(width, height);
      const panelTexture = this.createDataDisplayTexture(panelModes[i % panelModes.length], 256, 128);
      const panelMat = materialRegistry.getBasic('world.memorylane.ceilingPanel', {
        map: panelTexture,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      const angle = (i / 10) * Math.PI * 2;
      panel.position.set(Math.cos(angle) * 24, this.hallHeight - 1.6, Math.sin(angle) * 24);
      panel.rotation.x = Math.PI / 2;
      panel.rotation.z = angle * 0.15;
      panel.userData = {
        glitchTimer: 4 + Math.random() * 6,
        glitchDuration: 0,
        pulseOffset: Math.random() * Math.PI * 2,
        texture: panelTexture,
        scrollSpeed: 0.25 + Math.random() * 0.35
      };
      this.worldRoot.add(panel);
      this.ceilingPanels.push(panel);
    }
  }

  /**
   * Create animated data cables linking core to server towers
   */
  createDataCables() {
    const targets = this.serverTowers.slice(0, 12);
    const cableColors = [0x00ddff, 0x0066ff, 0x8f5dff, 0xff0088];

    targets.forEach((tower, index) => {
      const group = tower;
      const targetPos = group.position.clone();
      const targetY = (group.userData?.anchorY ?? 6) + 0.5;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, this.hallHeight / 2 + 0.5, 0),
        new THREE.Vector3(0, this.hallHeight / 2 + 2.6, 0),
        new THREE.Vector3(targetPos.x * 0.35, this.hallHeight * 0.62, targetPos.z * 0.35),
        new THREE.Vector3(targetPos.x, targetY, targetPos.z)
      ]);

      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.08 + (index % 3) * 0.02, 8, false);
      const cableMat = materialRegistry.getBasic('world.memorylane.dataCable', {
        color: cableColors[index % cableColors.length],
        emissive: cableColors[index % cableColors.length],
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide
      });

      const cable = new THREE.Mesh(tubeGeo, cableMat);
      cable.userData = {
        pulseOffset: Math.random() * Math.PI * 2
      };
      this.worldRoot.add(cable);
      this.dataCables.push(cable);
    });

    const crossLinks = [
      [0, 2], [1, 3], [4, 6], [5, 7]
    ];
    crossLinks.forEach(([a, b], index) => {
      const source = this.serverTowers[a % this.serverTowers.length];
      const target = this.serverTowers[b % this.serverTowers.length];
      if (!source || !target) {
        return;
      }
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(source.position.x, (source.userData?.anchorY ?? 6) + 0.4, source.position.z),
        new THREE.Vector3((source.position.x + target.position.x) * 0.5, this.hallHeight * 0.66 + index * 0.3, (source.position.z + target.position.z) * 0.5),
        new THREE.Vector3(target.position.x, (target.userData?.anchorY ?? 6) + 0.4, target.position.z)
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.05, 6, false);
      const cableMat = materialRegistry.getBasic('world.memorylane.crossCable', {
        color: 0xff0088,
        emissive: 0xff0088,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.35
      });
      const cable = new THREE.Mesh(tubeGeo, cableMat);
      this.worldRoot.add(cable);
      this.dataCables.push(cable);
    });
  }
  
  /**
   * Create perimeter walls for the central hall
   */
  createWalls() {
    const wallLength = this.hallSize;
    const wallHeight = this.hallHeight - 1;
    const wallDepth = 1.5;
    const wallMaterial = materialRegistry.getStandard('world.memorylane.wall', {
      color: 0x11121c,
      roughness: 0.58,
      metalness: 0.52,
      emissive: 0x070812,
      emissiveIntensity: 0.08,
      side: THREE.DoubleSide
    });

    const wallGeo = new THREE.BoxGeometry(wallLength, wallHeight, wallDepth);
    const wallOffsets = [
      { x: 0, z: -this.hallSize / 2 + wallDepth / 2, ry: 0 },
      { x: 0, z: this.hallSize / 2 - wallDepth / 2, ry: 0 },
      { x: -this.hallSize / 2 + wallDepth / 2, z: 0, ry: Math.PI / 2 },
      { x: this.hallSize / 2 - wallDepth / 2, z: 0, ry: Math.PI / 2 }
    ];

    wallOffsets.forEach((offset, index) => {
      const wall = new THREE.Mesh(wallGeo, wallMaterial.clone());
      wall.position.set(offset.x, wallHeight / 2, offset.z);
      wall.rotation.y = offset.ry;
      wall.userData = { side: index };
      this.worldRoot.add(wall);
      this.createWallDisplayPanels(wall, index);
    });

    this.createWallNeonFrames();
  }
  
  /**
   * Create wall-mounted data displays
   */
  createWallDisplayPanels(wall, sideIndex) {
    const displayCount = 3;
    const displayModes = ['neural', 'streams', 'stats', 'alert'];

    for (let i = 0; i < displayCount; i++) {
      const width = 9 + Math.random() * 2;
      const height = 4.5 + Math.random() * 1.5;
      const panelGeo = new THREE.PlaneGeometry(width, height);
      const texture = this.createDataDisplayTexture(displayModes[(sideIndex + i) % displayModes.length], 384, 192);
      const panelMaterial = materialRegistry.getBasic('world.memorylane.wallPanel', {
        map: texture,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });

      const panel = new THREE.Mesh(panelGeo, panelMaterial);
      panel.userData = {
        glitchTimer: 4 + Math.random() * 8,
        glitchDuration: 0,
        texture,
        pulseOffset: Math.random() * Math.PI * 2,
        scrollSpeed: 0.3 + Math.random() * 0.2
      };

      const y = 4.2 + i * 3.2;
      const offsetZ = -this.hallSize * 0.14 + i * 0.8;
      if (sideIndex === 0) {
        panel.position.set(0, y, -this.hallSize / 2 + 0.9);
        panel.rotation.y = 0;
      } else if (sideIndex === 1) {
        panel.position.set(0, y, this.hallSize / 2 - 0.9);
        panel.rotation.y = Math.PI;
      } else if (sideIndex === 2) {
        panel.position.set(-this.hallSize / 2 + 0.9, y, offsetZ);
        panel.rotation.y = Math.PI / 2;
      } else {
        panel.position.set(this.hallSize / 2 - 0.9, y, offsetZ);
        panel.rotation.y = -Math.PI / 2;
      }

      this.worldRoot.add(panel);
      this.dataDisplays.push(panel);
      this.glitchWalls.push(panel);
    }
  }
  
  /**
   * Create neon strips along floor edges
   */
  createFloorNeonStrips() {
    const stripLength = this.hallSize - 8;
    
    // Left strip
    const stripGeometry = new THREE.BoxGeometry(0.15, 0.05, stripLength);
    const stripMaterial = materialRegistry.getBasic('world.memorylane.floorStrip', {
      color: 0x00dddd,
      transparent: true,
      opacity: 0.6,
      emissive: 0x00dddd,
      emissiveIntensity: 0.5
    });
    
    const leftStrip = new THREE.Mesh(stripGeometry, stripMaterial);
    leftStrip.position.set(-this.hallSize / 2 + 1.2, 0.03, 0);
    leftStrip.userData = { pulseOffset: 0 };
    this.worldRoot.add(leftStrip);
    
    // Right strip
    const rightStrip = new THREE.Mesh(stripGeometry, stripMaterial.clone());
    rightStrip.position.set(this.hallSize / 2 - 1.2, 0.03, 0);
    rightStrip.userData = { pulseOffset: Math.PI };
    this.worldRoot.add(rightStrip);
    
    this.neonStrips = [leftStrip, rightStrip];
  }

  createDataDisplayTexture(mode, width = 256, height = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#060812';
    ctx.fillRect(0, 0, width, height);

    const primary = '#00ddff';
    const secondary = '#8f5dff';
    const accent = '#ff0088';
    const soft = '#7fefff';

    if (mode === 'neural') {
      ctx.strokeStyle = primary;
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < 6; i++) {
        const x = 24 + i * 36;
        ctx.beginPath();
        ctx.moveTo(x, 16);
        for (let y = 16; y < height - 16; y += 10) {
          ctx.lineTo(x + Math.sin((y + i * 12) * 0.06) * 12, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < 12; i++) {
        const x = 18 + (i % 4) * 56;
        const y = 26 + Math.floor(i / 4) * 42;
        ctx.fillStyle = i % 3 === 0 ? accent : i % 3 === 1 ? primary : secondary;
        ctx.beginPath();
        ctx.arc(x, y, 5 + Math.sin(i * 0.17) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (mode === 'streams') {
      ctx.strokeStyle = soft;
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        ctx.globalAlpha = 0.2 + i * 0.06;
        ctx.beginPath();
        for (let x = 0; x < width; x += 4) {
          const y = height / 2 + Math.sin(x * 0.03 + i * 0.7) * 22 + Math.cos(x * 0.012 + i) * 10;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (mode === 'stats') {
      ctx.fillStyle = '#0d1020';
      ctx.fillRect(12, 12, width - 24, height - 24);
      for (let i = 0; i < 5; i++) {
        const y = 24 + i * 32;
        ctx.fillStyle = i % 2 === 0 ? primary : secondary;
        ctx.fillRect(24, y, 64 + i * 16, 10);
        ctx.fillStyle = '#d6f8ff';
        ctx.font = '14px monospace';
        ctx.fillText(`node.${i}  ${Math.floor(92 + i * 3)}%`, 98, y + 10);
      }
    } else {
      ctx.fillStyle = '#120812';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.8;
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        const y = 18 + i * 14;
        ctx.moveTo(16, y);
        ctx.lineTo(width - 16, y + Math.sin(i * 0.4) * 4);
        ctx.stroke();
      }
      ctx.fillStyle = '#ffe2f0';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('AI AWAKENING', 20, 42);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  createWallNeonFrames() {
    const frameGeo = new THREE.BoxGeometry(this.hallSize - 4, 0.12, 0.12);
    const frameMat = materialRegistry.getBasic('world.memorylane.wallFrame', {
      color: 0x00ddff,
      emissive: 0x00ddff,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.42
    });

    const frames = [
      { x: 0, y: 0.8, z: -this.hallSize / 2 + 0.75, ry: 0 },
      { x: 0, y: 0.8, z: this.hallSize / 2 - 0.75, ry: 0 },
      { x: -this.hallSize / 2 + 0.75, y: 0.8, z: 0, ry: Math.PI / 2 },
      { x: this.hallSize / 2 - 0.75, y: 0.8, z: 0, ry: Math.PI / 2 }
    ];

    frames.forEach(frame => {
      const mesh = new THREE.Mesh(frameGeo, frameMat.clone());
      mesh.position.set(frame.x, frame.y, frame.z);
      mesh.rotation.y = frame.ry;
      this.worldRoot.add(mesh);
    });
  }
  
  /**
   * Create floating rectangular holograms
   */
  createFloatingHolograms() {
    const displayConfigs = [
      { x: 0, y: 7.2, z: -this.hallSize / 2 + 1.2, ry: 0, mode: 'neural', width: 10, height: 5.5 },
      { x: 0, y: 7.2, z: this.hallSize / 2 - 1.2, ry: Math.PI, mode: 'streams', width: 10, height: 5.5 },
      { x: -this.hallSize / 2 + 1.2, y: 8.5, z: 0, ry: Math.PI / 2, mode: 'stats', width: 8, height: 6.2 },
      { x: this.hallSize / 2 - 1.2, y: 8.5, z: 0, ry: -Math.PI / 2, mode: 'alert', width: 8, height: 6.2 }
    ];

    displayConfigs.forEach((config, index) => {
      const texture = this.createDataDisplayTexture(config.mode, 512, 256);
      const geometry = new THREE.PlaneGeometry(config.width, config.height);
      const material = materialRegistry.getBasic('world.memorylane.hologram', {
        map: texture,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const display = new THREE.Mesh(geometry, material);
      display.position.set(config.x, config.y, config.z);
      display.rotation.y = config.ry;
      display.userData = {
        floatSpeed: 0.02 + index * 0.005,
        floatOffset: Math.random() * Math.PI * 2,
        originalY: config.y,
        scrollSpeed: 0.12 + Math.random() * 0.18,
        texture,
        mode: config.mode
      };
      this.worldRoot.add(display);
      this.holograms.push(display);
      this.dataDisplays.push(display);
    });
  }
  
  /**
   * Create individual data hologram
   */
  createDataHologram() {
    const width = 4 + Math.random() * 2;
    const height = 2.5 + Math.random();
    
    const hologramGeometry = new THREE.PlaneGeometry(width, height);
    const texture = this.createDataDisplayTexture(Math.random() > 0.5 ? 'neural' : 'streams', 256, 128);
    const hologramMaterial = materialRegistry.getBasic('world.memorylane.hologram', {
      map: texture,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    
    const hologram = new THREE.Mesh(hologramGeometry, hologramMaterial);
    hologram.userData.texture = texture;
    
    return hologram;
  }
  
  /**
   * Create 3D memory shards
   */
  createMemoryShards() {
    const shardCount = 10;
    
    for (let i = 0; i < shardCount; i++) {
      const shardGeometry = new THREE.BoxGeometry(1.6, 4.5 + Math.random() * 2.5, 1.2);
      const shardMaterial = materialRegistry.getBasic('world.memorylane.memoryShard', {
        color: i % 3 === 0 ? 0x00ddff : i % 3 === 1 ? 0x8f5dff : 0xff0088,
        transparent: true,
        opacity: 0.48,
        emissive: i % 3 === 0 ? 0x00ddff : i % 3 === 1 ? 0x8f5dff : 0xff0088,
        emissiveIntensity: 0.18,
        side: THREE.DoubleSide
      });
      
      const shard = new THREE.Mesh(shardGeometry, shardMaterial);
      
      const angle = (i / shardCount) * Math.PI * 2;
      const radius = 38 + Math.random() * 4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 5 + Math.random() * 4.5;
      
      shard.position.set(x, y, z);
      shard.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      shard.userData = {
        floatSpeed: 0.05 + Math.random() * 0.05,
        floatOffset: Math.random() * Math.PI * 2,
        rotationSpeed: 0.08 + Math.random() * 0.1,
        originalY: y,
        driftSpeed: 0.18 + Math.random() * 0.18,
        driftAngle: Math.random() * Math.PI * 2,
        wallLocked: true
      };
      
      // Add edges
      const edgeGeometry = new THREE.EdgesGeometry(shardGeometry);
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
        color: 0xaa88ff,
        transparent: true,
        opacity: 0.35
      });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      shard.add(edges);
      
      this.worldRoot.add(shard);
      this.memoryShards.push(shard);
      this.memoryCrystals.push(shard);
    }
  }
  
  /**
   * Create particle drift
   */
  createParticleDrift() {
    const streamTargets = [
      new THREE.Vector3(0, 7.2, -this.hallSize / 2 + 2),
      new THREE.Vector3(0, 7.2, this.hallSize / 2 - 2),
      new THREE.Vector3(-this.hallSize / 2 + 2, 8.5, 0),
      new THREE.Vector3(this.hallSize / 2 - 2, 8.5, 0)
    ];

    streamTargets.forEach((target, index) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, this.hallHeight / 2 + 0.7, 0),
        new THREE.Vector3(0, this.hallHeight / 2 + 1.8, 0),
        new THREE.Vector3(target.x * 0.38, this.hallHeight * 0.55, target.z * 0.38),
        target
      ]);

      const streamGeo = new THREE.TubeGeometry(curve, 40, 0.16 + index * 0.01, 8, false);
      const streamMat = materialRegistry.getBasic('world.memorylane.dataStream', {
        color: index % 3 === 0 ? 0x00ddff : index % 3 === 1 ? 0x8f5dff : 0xff0088,
        emissive: index % 3 === 0 ? 0x00ddff : index % 3 === 1 ? 0x8f5dff : 0xff0088,
        emissiveIntensity: 0.52,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide
      });

      const stream = new THREE.Mesh(streamGeo, streamMat);
      stream.userData = {
        pulseOffset: Math.random() * Math.PI * 2,
        targetIndex: index
      };
      this.worldRoot.add(stream);
      this.dataStreams.push(stream);
    });

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const velocities = [];
    
    const particleCount = 90;
    
    const color1 = new THREE.Color(0x00dddd);
    const color2 = new THREE.Color(0x8800ff);
    
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 42;
      const y = 1.5 + Math.random() * 12;
      const z = (Math.random() - 0.5) * 42;
      
      positions.push(x, y, z);
      
      const color = color1.clone().lerp(color2, Math.random());
      colors.push(color.r, color.g, color.b);
      
      velocities.push(
        (Math.random() - 0.5) * 0.02,
        Math.random() * 0.015 + 0.005,
        (Math.random() - 0.5) * 0.02
      );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.11,
      vertexColors: true,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.particles.userData.velocities = velocities;
    this.worldRoot.add(this.particles);
  }
  
  /**
   * Create holographic arcs above
   */
  createHolographicArcs() {
    this.arcs = [];
    
    for (let i = 0; i < 8; i++) {
      const points = [];
      const segments = 26;
      const angle = (i / 8) * Math.PI * 2;
      const radius = 22 + (i % 2) * 6;
      const z = Math.sin(angle) * radius;
      const x = Math.cos(angle) * radius;
      
      for (let j = 0; j < segments; j++) {
        const t = j / (segments - 1);
        const arcX = (t - 0.5) * 44;
        const arcY = this.hallHeight - 2.2 + Math.sin(t * Math.PI) * 1.6;
        const arcZ = z + Math.cos(t * Math.PI * 2 + angle) * 1.8;
        points.push(new THREE.Vector3(arcX + x * 0.18, arcY, arcZ));
      }
      
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 44, 0.06, 8, false);
      const tubeMaterial = materialRegistry.getBasic('world.memorylane.holographicArc', {
        color: i % 2 === 0 ? 0x00ddff : 0x8f5dff,
        transparent: true,
        opacity: 0,
        emissive: i % 2 === 0 ? 0x00ddff : 0x8f5dff,
        emissiveIntensity: 0.22
      });
      
      const arc = new THREE.Mesh(tubeGeometry, tubeMaterial);
      arc.userData = {
        fadeTimer: Math.random() * 20,
        fadeDuration: 0,
        fadePhase: 0
      };
      
      this.worldRoot.add(arc);
      this.arcs.push(arc);
    }
  }
  
  /**
   * Create volumetric fog effect
   */
  createVolumetricFog() {
    // Low fog planes
    const fogConfigs = [
      { y: 0.15, color: 0x0b2a44, opacity: 0.05, scale: 58 },
      { y: 1.2, color: 0x2f1448, opacity: 0.035, scale: 46 },
      { y: 3.4, color: 0x2a4b36, opacity: 0.025, scale: 38 }
    ];

    fogConfigs.forEach((config, index) => {
      const fogGeometry = new THREE.PlaneGeometry(config.scale, config.scale);
      const fogMaterial = materialRegistry.getBasic(`world.memorylane.fog${index}`, {
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });

      const fogPlane = new THREE.Mesh(fogGeometry, fogMaterial);
      fogPlane.rotation.x = -Math.PI / 2;
      fogPlane.position.y = config.y;
      fogPlane.userData = {
        baseOpacity: config.opacity,
        pulseOffset: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.2 + index * 0.1
      };
      this.worldRoot.add(fogPlane);
      this.zoneFogLayers.push(fogPlane);
    });
  }
  
  /**
   * Update Memory Lane animations
   */
  update(deltaTime, time) {
    const corePulse = Math.sin(time * 1.1) * 0.5 + 0.5;

    if (this.coreStalk) {
      this.coreStalk.rotation.y += deltaTime * 0.08;
      this.coreStalk.material.emissiveIntensity = 0.16 + corePulse * 0.08;
    }

    if (this.coreShell) {
      this.coreShell.rotation.y -= deltaTime * 0.12;
      this.coreShell.material.opacity = 0.08 + corePulse * 0.04;
    }

    if (this.coreActivityColumn) {
      this.coreActivityColumn.rotation.y += deltaTime * 0.2;
      this.coreActivityColumn.material.opacity = 0.12 + corePulse * 0.06;
    }

    if (this.innerCore) {
      const innerScale = 1 + corePulse * 0.08;
      this.innerCore.scale.set(innerScale, innerScale, innerScale);
      this.innerCore.material.emissiveIntensity = 1.2 + corePulse * 0.6;
    }

    if (this.coreLight) {
      this.coreLight.intensity = 0.9 + corePulse * 0.55;
    }

    // Server towers pulse
    this.serverTowers.forEach(tower => {
      const data = tower.userData;
      const pulse = Math.sin(time * 1.5 + data.pulseOffset);
      
      // Pulse edges
      if (data.edges) {
        data.edges.material.opacity = 0.3 + pulse * 0.15;
      }
      
      // Pulse rim light
      if (data.rimLight) {
        data.rimLight.intensity = 0.25 + pulse * 0.1;
      }
      
      // Pulse status lights
      tower.children.forEach(child => {
        if (child.isMesh && child.userData.baseColor) {
          const lightPulse = Math.sin(time * 2 + child.userData.pulseOffset);
          child.material.opacity = 0.5 + lightPulse * 0.2;
        }
      });
    });
    
    // Ceiling panels glitch
    this.ceilingPanels.forEach(panel => {
      const basePulse = Math.sin(time * 0.8 + panel.userData.pulseOffset);
      panel.material.opacity = 0.16 + basePulse * 0.08;
      if (panel.userData.texture) {
        panel.userData.texture.offset.y += deltaTime * panel.userData.scrollSpeed * 0.12;
      }
      
      // Occasional glitch
      panel.userData.glitchTimer -= deltaTime;
      if (panel.userData.glitchTimer <= 0) {
        panel.material.opacity = 0.26 + Math.random() * 0.18;
        panel.userData.glitchTimer = 4 + Math.random() * 8;
      }
    });

    this.galleries.forEach(gallery => {
      const pulse = Math.sin(time * 0.7 + (gallery.userData?.pulseOffset || 0)) * 0.5 + 0.5;
      if (gallery.material && gallery.material.opacity !== undefined) {
        gallery.material.opacity = 0.7 + pulse * 0.16;
      }
      if (gallery.rotation && gallery.userData?.rotationSpeed) {
        gallery.rotation.y += deltaTime * gallery.userData.rotationSpeed;
      }
    });
    
    // Neon floor strips pulse
    if (this.neonStrips) {
      this.neonStrips.forEach(strip => {
        const pulse = Math.sin(time * 2 + strip.userData.pulseOffset);
        strip.material.opacity = 0.5 + pulse * 0.2;
        strip.material.emissiveIntensity = 0.4 + pulse * 0.2;
      });
    }
    
    // Floating holograms
    this.holograms.forEach(hologram => {
      const data = hologram.userData;
      
      // Float animation
      hologram.position.y = data.originalY + 
        Math.sin(time * data.floatSpeed + data.floatOffset) * 0.28;
      
      // Scroll texture
      if (data.texture) {
        data.texture.offset.y += deltaTime * data.scrollSpeed * 0.1;
      }
      
      // Gentle rotation
      hologram.rotation.y += deltaTime * 0.1;
    });

    this.dataDisplays.forEach(display => {
      const data = display.userData || {};
      const pulse = Math.sin(time * 0.45 + (data.floatOffset || 0)) * 0.5 + 0.5;
      display.position.y = (data.originalY || display.position.y) + Math.sin(time * (data.floatSpeed || 0.02) + (data.floatOffset || 0)) * 0.2;
      if (display.material?.opacity !== undefined) {
        display.material.opacity = 0.82 + pulse * 0.1;
      }
      if (data.texture) {
        data.texture.offset.y += deltaTime * (data.scrollSpeed || 0.1) * 0.08;
      }
    });
    
    // Memory shards
    this.memoryShards.forEach(shard => {
      const data = shard.userData;
      
      // Float animation
      shard.position.y = data.originalY + 
        Math.sin(time * data.floatSpeed + data.floatOffset) * 0.7;
      
      // Wall-locked drift stays subtle in the hall
      if (!data.wallLocked) {
        data.driftAngle += deltaTime * 0.3;
        shard.position.x += Math.sin(data.driftAngle) * deltaTime * data.driftSpeed;
      }
      
      // Rotation
      shard.rotation.x += data.rotationSpeed * deltaTime;
      shard.rotation.y += data.rotationSpeed * deltaTime * 0.5;
    });
    
    // Particle drift
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.userData.velocities;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * deltaTime * 10;
        positions[i + 1] += velocities[i + 1] * deltaTime * 10;
        positions[i + 2] += velocities[i + 2] * deltaTime * 10;
        
        // Reset if out of bounds
        if (positions[i + 1] > 12 || 
            Math.abs(positions[i]) > 24 || 
            Math.abs(positions[i + 2]) > 24) {
          positions[i] = (Math.random() - 0.5) * 32;
          positions[i + 1] = 0.8 + Math.random() * 10;
          positions[i + 2] = (Math.random() - 0.5) * 32;
        }
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
      this.particles.material.opacity = 0.24 + Math.sin(time * 0.25) * 0.03;
    }
    
    // Wall glitches
    this.glitchWalls.forEach(wall => {
      wall.userData.glitchTimer -= deltaTime;
      
      if (wall.userData.glitchTimer <= 0 && wall.userData.glitchDuration <= 0) {
        wall.userData.glitchDuration = 0.15 + Math.random() * 0.2;
        wall.userData.glitchTimer = 10 + Math.random() * 15;
      }
      
      if (wall.userData.glitchDuration > 0) {
        wall.userData.glitchDuration -= deltaTime;
        wall.material.opacity = 0.64 + Math.random() * 0.12;
      } else {
        wall.material.opacity = 0.78;
      }
    });

    this.zoneFogLayers.forEach((fog, index) => {
      const pulse = Math.sin(time * fog.userData.wobbleSpeed + fog.userData.pulseOffset) * 0.5 + 0.5;
      fog.material.opacity = fog.userData.baseOpacity * (0.7 + pulse * 0.6);
      fog.position.x = Math.sin(time * 0.08 + index * 1.2) * 1.5;
      fog.position.z = Math.cos(time * 0.06 + index * 1.6) * 1.5;
    });
    
    // Holographic arcs
    this.arcs.forEach(arc => {
      arc.userData.fadeTimer -= deltaTime;
      
      if (arc.userData.fadeTimer <= 0 && arc.userData.fadeDuration <= 0) {
        arc.userData.fadeDuration = 5 + Math.random() * 3;
        arc.userData.fadeTimer = 15 + Math.random() * 20;
        arc.userData.fadePhase = 0;
      }
      
      if (arc.userData.fadeDuration > 0) {
        arc.userData.fadeDuration -= deltaTime;
        arc.userData.fadePhase += deltaTime * 0.5;
        
        const fadeIn = Math.min(arc.userData.fadePhase, 1);
        const fadeOut = Math.max(0, arc.userData.fadeDuration / 2);
        const opacity = Math.min(fadeIn, fadeOut) * 0.2;
        
        arc.material.opacity = opacity;
      } else {
        arc.material.opacity = 0;
      }
    });

    this.dataCables.forEach((cable, index) => {
      const pulse = Math.sin(time * 0.8 + (cable.userData?.pulseOffset || 0)) * 0.5 + 0.5;
      if (cable.material?.opacity !== undefined) {
        cable.material.opacity = 0.4 + pulse * 0.22;
      }
      if (cable.rotation) {
        cable.rotation.z += Math.sin(time * 0.1 + index) * 0.0004;
      }
    });
  }
}
