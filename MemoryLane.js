import * as THREE from 'three';
import { materialRegistry } from './src/metrics/rendering/MaterialRegistry_v1.js';

/**
 * Memory Lane - Endless dream datacenter corridor
 * Walking through the AI's own memories
 */
export class MemoryLane {
  constructor({ scene, worldRoot }) {
    this.scene = scene;
    this.worldRoot = worldRoot;
    this.serverTowers = [];
    this.holograms = [];
    this.memoryShards = [];
    this.ceilingPanels = [];
    this.glitchWalls = [];
    
    this.createFloor();
    this.createServerTowers();
    this.createCeiling();
    this.createWalls();
    this.createFloorNeonStrips();
    this.createFloatingHolograms();
    this.createMemoryShards();
    this.createParticleDrift();
    this.createHolographicArcs();
  }
  
  /**
   * Create dark reflective floor
   */
  createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(30, 500);
    const floorMaterial = materialRegistry.getStandard('world.memorylane.floor', {
      color: 0x0a0a0f,
      roughness: 0.2,
      metalness: 0.9
    });
    
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = 0;
    this.worldRoot.add(this.floor);
  }
  
  /**
   * Create modular server towers along sides
   */
  createServerTowers() {
    const towerCount = 40;
    const spacing = 12;
    
    for (let i = 0; i < towerCount; i++) {
      // Left side tower
      this.createServerTower(-10, i * spacing - 50, 'left');
      
      // Right side tower
      this.createServerTower(10, i * spacing - 50, 'right');
    }
  }
  
  /**
   * Create individual server tower
   */
  createServerTower(x, z, side) {
    const towerGroup = new THREE.Group();
    
    // Main tower body
    const towerGeometry = new THREE.BoxGeometry(4, 8, 3);
    const towerMaterial = materialRegistry.getStandard('world.memorylane.tower', {
      color: 0x1a1a22,
      roughness: 0.4,
      metalness: 0.8
    });
    
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = 4;
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
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x00dddd,
      transparent: true,
      opacity: 0.4
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.position.y = 4;
    edges.userData = { pulseOffset: Math.random() * Math.PI * 2 };
    towerGroup.add(edges);
    
    // Server panels (3 horizontal sections)
    for (let i = 0; i < 3; i++) {
      const panelHeight = 2;
      const panelY = 2 + i * 2.5;
      
      // Colored status light
      const lightColor = i === 0 ? 0x00dddd : i === 1 ? 0x8800ff : 0xaaaaaa;
      const lightGeometry = new THREE.BoxGeometry(0.3, 0.1, 2.5);
      const lightMaterial = materialRegistry.getBasic('world.memorylane.towerLight', {
        color: lightColor,
        transparent: true,
        opacity: 0.6
      });
      
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(side === 'left' ? 2.1 : -2.1, panelY, 0);
      light.userData = { 
        pulseOffset: Math.random() * Math.PI * 2,
        baseColor: lightColor 
      };
      towerGroup.add(light);
    }
    
    // Rim light
    const rimLight = new THREE.PointLight(0x00dddd, 0.3, 8);
    rimLight.position.set(side === 'left' ? -2 : 2, 5, 0);
    towerGroup.add(rimLight);
    
    towerGroup.position.set(x, 0, z);
    towerGroup.userData = {
      pulseOffset: Math.random() * Math.PI * 2,
      edges: edges,
      rimLight: rimLight
    };
    
    this.worldRoot.add(towerGroup);
    this.serverTowers.push(towerGroup);
  }
  
  /**
   * Create ceiling with light panels
   */
  createCeiling() {
    const panelCount = 40;
    const spacing = 12;
    
    for (let i = 0; i < panelCount; i++) {
      const z = i * spacing - 50;
      
      // Hexagonal panel
      const panelGeometry = new THREE.CylinderGeometry(3, 3, 0.3, 6);
      const panelMaterial = materialRegistry.getBasic('world.memorylane.ceilingPanel', {
        color: 0x4433aa,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
      });
      
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.rotation.x = Math.PI / 2;
      panel.position.set(0, 10, z);
      
      panel.userData = {
        pulseOffset: Math.random() * Math.PI * 2,
        glitchTimer: Math.random() * 10
      };
      
      this.worldRoot.add(panel);
      this.ceilingPanels.push(panel);
      
      // Panel outline
      const outlineGeometry = new THREE.EdgesGeometry(panelGeometry);
      const pos = outlineGeometry.attributes?.position?.array;
      if (pos) {
        for (let i = 0; i < pos.length; i++) {
          if (!Number.isFinite(pos[i])) {
            console.error('[GeometrySource] NaN created in EdgesGeometry', outlineGeometry);
            break;
          }
        }
      }
      const outlineMaterial = new THREE.LineBasicMaterial({
        color: 0x8866ff,
        transparent: true,
        opacity: 0.2
      });
      const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
      outline.rotation.x = Math.PI / 2;
      outline.position.set(0, 10, z);
      this.worldRoot.add(outline);
    }
  }
  
  /**
   * Create corridor walls
   */
  createWalls() {
    const wallLength = 500;
    const wallHeight = 10;
    
    // Left wall
    const leftWallGeometry = new THREE.PlaneGeometry(wallLength, wallHeight);
    const wallMaterial = materialRegistry.getStandard('world.memorylane.wall', {
      color: 0x1a1a25,
      roughness: 0.6,
      metalness: 0.4,
      side: THREE.DoubleSide
    });
    
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-15, 5, 0);
    this.worldRoot.add(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial.clone());
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(15, 5, 0);
    this.worldRoot.add(rightWall);
    
    // Wall glitch panels
    this.createWallGlitchPanels(leftWall, 'left');
    this.createWallGlitchPanels(rightWall, 'right');
  }
  
  /**
   * Create glitch panels on walls
   */
  createWallGlitchPanels(wall, side) {
    const panelCount = 15;
    
    for (let i = 0; i < panelCount; i++) {
      const z = (Math.random() - 0.5) * 400;
      const y = 2 + Math.random() * 6;
      
      const panelGeometry = new THREE.PlaneGeometry(2, 1.5);
      const panelMaterial = materialRegistry.getBasic('world.memorylane.wallPanel', {
        color: 0x00ffff,
        transparent: true,
        opacity: 0,
        wireframe: true,
        side: THREE.DoubleSide
      });
      
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(side === 'left' ? -14.9 : 14.9, y, z);
      panel.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
      
      panel.userData = {
        glitchTimer: Math.random() * 15,
        glitchDuration: 0
      };
      
      this.worldRoot.add(panel);
      this.glitchWalls.push(panel);
    }
  }
  
  /**
   * Create neon strips along floor edges
   */
  createFloorNeonStrips() {
    const stripLength = 500;
    
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
    leftStrip.position.set(-12, 0.03, 0);
    leftStrip.userData = { pulseOffset: 0 };
    this.worldRoot.add(leftStrip);
    
    // Right strip
    const rightStrip = new THREE.Mesh(stripGeometry, stripMaterial.clone());
    rightStrip.position.set(12, 0.03, 0);
    rightStrip.userData = { pulseOffset: Math.PI };
    this.worldRoot.add(rightStrip);
    
    this.neonStrips = [leftStrip, rightStrip];
  }
  
  /**
   * Create floating rectangular holograms
   */
  createFloatingHolograms() {
    const hologramCount = 20;
    
    for (let i = 0; i < hologramCount; i++) {
      const hologram = this.createDataHologram();
      
      const x = (Math.random() - 0.5) * 20;
      const y = 2 + Math.random() * 5;
      const z = (Math.random() - 0.5) * 400;
      
      hologram.position.set(x, y, z);
      hologram.rotation.y = (Math.random() - 0.5) * Math.PI / 4;
      
      hologram.userData = {
        floatSpeed: 0.1 + Math.random() * 0.1,
        floatOffset: Math.random() * Math.PI * 2,
        originalY: y,
        scrollSpeed: 0.5 + Math.random() * 0.5
      };
      
      this.worldRoot.add(hologram);
      this.holograms.push(hologram);
    }
  }
  
  /**
   * Create individual data hologram
   */
  createDataHologram() {
    const width = 2 + Math.random() * 2;
    const height = 1.5 + Math.random();
    
    const hologramGeometry = new THREE.PlaneGeometry(width, height);
    
    // Create canvas texture with scrolling data
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Generate abstract data pattern
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 256, 256);
    
    const patternType = Math.floor(Math.random() * 3);
    ctx.strokeStyle = '#00dddd';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    
    if (patternType === 0) {
      // Binary pattern
      ctx.font = '12px monospace';
      ctx.fillStyle = '#00dddd';
      for (let i = 0; i < 10; i++) {
        const binary = Math.random().toString(2).substring(2, 20);
        ctx.fillText(binary, 10, 20 + i * 20);
      }
    } else if (patternType === 1) {
      // Waveform
      ctx.beginPath();
      for (let x = 0; x < 256; x += 2) {
        const y = 128 + Math.sin(x * 0.05) * 40 + Math.sin(x * 0.1) * 20;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else {
      // Grid symbols
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const x = i * 32 + 16;
          const y = j * 32 + 16;
          ctx.strokeRect(x - 5, y - 5, 10, 10);
        }
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    const hologramMaterial = materialRegistry.getBasic('world.memorylane.hologram', {
      map: texture,
      transparent: true,
      opacity: 0.25,
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
    const shardCount = 12;
    
    for (let i = 0; i < shardCount; i++) {
      const shardGeometry = new THREE.BoxGeometry(1, 1.5, 0.2);
      const shardMaterial = materialRegistry.getBasic('world.memorylane.memoryShard', {
        color: 0xaa88ff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      
      const shard = new THREE.Mesh(shardGeometry, shardMaterial);
      
      const x = (Math.random() - 0.5) * 25;
      const y = 1 + Math.random() * 7;
      const z = (Math.random() - 0.5) * 400;
      
      shard.position.set(x, y, z);
      shard.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      shard.userData = {
        floatSpeed: 0.08 + Math.random() * 0.08,
        floatOffset: Math.random() * Math.PI * 2,
        rotationSpeed: 0.2 + Math.random() * 0.2,
        originalY: y,
        driftSpeed: 0.5 + Math.random() * 0.5,
        driftAngle: Math.random() * Math.PI * 2
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
        opacity: 0.5
      });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      shard.add(edges);
      
      this.worldRoot.add(shard);
      this.memoryShards.push(shard);
    }
  }
  
  /**
   * Create particle drift
   */
  createParticleDrift() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const velocities = [];
    
    const particleCount = 150;
    
    const color1 = new THREE.Color(0x00dddd);
    const color2 = new THREE.Color(0x8800ff);
    
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 25;
      const y = Math.random() * 10;
      const z = (Math.random() - 0.5) * 400;
      
      positions.push(x, y, z);
      
      const color = color1.clone().lerp(color2, Math.random());
      colors.push(color.r, color.g, color.b);
      
      velocities.push(
        (Math.random() - 0.5) * 0.05,
        Math.random() * 0.03 + 0.01,
        (Math.random() - 0.5) * 0.1
      );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
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
    
    for (let i = 0; i < 6; i++) {
      const points = [];
      const segments = 20;
      const z = i * 80 - 150;
      
      for (let j = 0; j < segments; j++) {
        const t = j / (segments - 1);
        const x = (t - 0.5) * 25;
        const y = 8 + Math.sin(t * Math.PI) * 2;
        
        points.push(new THREE.Vector3(x, y, z));
      }
      
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeometry = new THREE.TubeGeometry(curve, 40, 0.08, 8, false);
      const tubeMaterial = materialRegistry.getBasic('world.memorylane.holographicArc', {
        color: 0x6633ff,
        transparent: true,
        opacity: 0,
        emissive: 0x6633ff,
        emissiveIntensity: 0.3
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
    const fogGeometry = new THREE.PlaneGeometry(30, 100);
    const fogMaterial = materialRegistry.getBasic('world.memorylane.fog', {
      color: 0x2a2a44,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide
    });
    
    this.fogPlane = new THREE.Mesh(fogGeometry, fogMaterial);
    this.fogPlane.rotation.x = -Math.PI / 2;
    this.fogPlane.position.y = 0.2;
    this.worldRoot.add(this.fogPlane);
  }
  
  /**
   * Update Memory Lane animations
   */
  update(deltaTime, time) {
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
      panel.material.opacity = 0.12 + basePulse * 0.05;
      
      // Occasional glitch
      panel.userData.glitchTimer -= deltaTime;
      if (panel.userData.glitchTimer <= 0) {
        panel.material.opacity = 0.3 + Math.random() * 0.2;
        panel.userData.glitchTimer = 5 + Math.random() * 10;
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
        Math.sin(time * data.floatSpeed + data.floatOffset) * 0.5;
      
      // Scroll texture
      if (data.texture) {
        data.texture.offset.y += deltaTime * data.scrollSpeed * 0.1;
      }
      
      // Gentle rotation
      hologram.rotation.y += deltaTime * 0.1;
    });
    
    // Memory shards
    this.memoryShards.forEach(shard => {
      const data = shard.userData;
      
      // Float animation
      shard.position.y = data.originalY + 
        Math.sin(time * data.floatSpeed + data.floatOffset) * 1;
      
      // Drift across corridor
      data.driftAngle += deltaTime * 0.3;
      shard.position.x += Math.sin(data.driftAngle) * deltaTime * data.driftSpeed;
      
      // Rotation
      shard.rotation.x += data.rotationSpeed * deltaTime;
      shard.rotation.y += data.rotationSpeed * deltaTime * 0.7;
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
            Math.abs(positions[i]) > 15 || 
            Math.abs(positions[i + 2]) > 250) {
          positions[i] = (Math.random() - 0.5) * 25;
          positions[i + 1] = 0;
          positions[i + 2] = (Math.random() - 0.5) * 400;
        }
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
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
        wall.material.opacity = 0.1 + Math.random() * 0.15;
      } else {
        wall.material.opacity = 0;
      }
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
  }
}
