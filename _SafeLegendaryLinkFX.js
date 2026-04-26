import * as THREE from 'three';
import { tagAllowedSphere, clampSphere } from './VisualSpherePolicy.js';
import { safeSetEmissive } from './_EmissiveUtils.js';
import { freezeMaterialConfig } from './Engine/Debug/MaterialFreezeGuard.js';

/**
 * SAFE LEGENDARY LINK FX
 * 
 * ABSOLUTE SAFETY RULES - STRICTLY ENFORCED:
 * - ZERO modifications to Link objects
 * - ZERO new fields added to links
 * - ZERO modifications to NodeLinkingSystem.js
 * - ZERO shader or material overrides
 * - All state stored ONLY in external LegendaryLinkRegistry
 * - All VFX are overlays, children, or particles
 * - Read-only access to evolution and legendary node systems
 * - Completely non-invasive and reversible
 */

export class SafeLegendaryLinkFX {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    // EXTERNAL STATE - Never touch link internals
    this.registry = {};
    this.vfxContainers = {};
    
    // Legendary link type definitions
    this.legendaryTypes = {
      AURORA: {
        colors: [0x20314f, 0x6f85bf, 0x7a69c0, 0xa0a9b8, 0x728096],
        bandCount: 3,
        pulseSpeed: 2.0,
        glowIntensity: 0.8
      },
      FRACTAL: {
        primaryColor: 0x7a69c0,
        panelColor: 0x66508f,
        panelCount: 4,
        shardCount: 6,
        shimmerIntensity: 0.6
      },
      SINGULARITY: {
        coreColor: 0x20314f,
        trailColor: 0x66508f,
        shockwaveColor: 0x7a69c0,
        distortionIntensity: 0.4
      },
      SIGMA_PRIME: {
        baseColor: 0x20314f,
        glitchColor: 0x8b6a7b,
        frameColor: 0x6f85bf,
        sparkCount: 5
      },
      QUANTUM_CROWN: {
        spectrumColors: [0x20314f, 0x728096, 0x66508f, 0x7a69c0, 0xa0a9b8, 0x6f85bf, 0x8b6a7b],
        echoOpacity: 0.3,
        pulseFrequency: 1.5,
        particleCount: 8
      }
    };
    
    // Configuration
    this.config = {
      maxLegendaryLinks: 20,
      trafficThreshold: 2.0,
      synergyChainLength: 5,
      fadeDuration: 0.8,
      burstDuration: 0.4,
      bandThickness: 0.02,
      particleSize: 0.03
    };
    
    // Tracking
    this.lastUpdateFrame = 0;
    this.activeBursts = [];

    // Material template cache (clone per use to keep per-mesh edits isolated)
    this.materialPool = new Map();
  }

  getMaterial(key, factory) {
    if (!this.materialPool.has(key)) {
      const created = factory();
      freezeMaterialConfig(created);
      this.materialPool.set(key, created);
    }
    const base = this.materialPool.get(key);
    return base.clone ? base.clone() : base;
  }
  
  /**
   * MATERIAL SAFETY: Check if material supports emissive properties
   */
  ensureEmissiveSafe(mat) {
    if (!mat || typeof mat !== 'object') return false;
    return (
      mat.isMeshStandardMaterial ||
      mat.isMeshLambertMaterial ||
      mat.isMeshPhongMaterial ||
      mat.isMeshToonMaterial
    );
  }

  /**
   * Get safe link identifier
   */
  getLinkId(link) {
    if (link.uuid) return link.uuid;
    if (!link.userData) link.userData = {};
    if (!link.userData.linkId) {
      link.userData.linkId = `link_${Math.random().toString(36).substr(2, 9)}`;
    }
    return link.userData.linkId;
  }
  
  /**
   * Main update loop (called once per frame)
   */
  update(deltaTime, links, legendaryPack, evolutionRegistry) {
    if (!links || links.length === 0) return;
    
    // Periodically check for new legendary links
    this.checkLegendaryLinkSpawns(links, legendaryPack, evolutionRegistry);
    
    // Update all active legendary links
    for (const linkId in this.registry) {
      const state = this.registry[linkId];
      const vfx = this.vfxContainers[linkId];
      
      // Find link in system
      const link = this.findLinkById(linkId, links);
      if (!link) {
        this.deLegendaryLink(linkId);
        continue;
      }
      
      // Update intensity based on traffic
      this.updateLinkIntensity(state, link);
      
      // Update VFX based on type
      this.updateLegendaryLinkVFX(link, state, vfx, deltaTime);
    }
    
    // Update burst effects
    this.updateBursts(deltaTime);
  }
  
  /**
   * Check for and create new legendary links
   */
  checkLegendaryLinkSpawns(links, legendaryPack, evolutionRegistry) {
    if (!legendaryPack) return;
    
    // Don't exceed max
    const activeLegendary = Object.keys(this.registry).length;
    if (activeLegendary >= this.config.maxLegendaryLinks) {
      return;
    }
    
    links.forEach(link => {
      const linkId = this.getLinkId(link);
      
      // Skip if already legendary
      if (this.registry[linkId]) return;
      
      // Check if should become legendary
      const shouldBecome = this.shouldBecomeLegendaryLink(
        link,
        linkId,
        legendaryPack,
        evolutionRegistry
      );
      
      if (shouldBecome.isLegendary) {
        this.makeLegendaryLink(link, linkId, shouldBecome.type, link.source.position, link.target.position);
      }
    });
  }
  
  /**
   * Determine if link should be legendary
   */
  shouldBecomeLegendaryLink(link, linkId, legendaryPack, evolutionRegistry) {
    // Check if either endpoint is legendary
    const sourceLegendary = link.source && legendaryPack.isLegendary(this.getNodeId(link.source));
    const targetLegendary = link.target && legendaryPack.isLegendary(this.getNodeId(link.target));
    
    if (sourceLegendary || targetLegendary) {
      // Get legendary type from the legendary node
      let type = 'AURORA';
      if (sourceLegendary) {
        const info = legendaryPack.getLegendaryInfo(this.getNodeId(link.source));
        type = info?.type || 'AURORA';
      } else if (targetLegendary) {
        const info = legendaryPack.getLegendaryInfo(this.getNodeId(link.target));
        type = info?.type || 'AURORA';
      }
      
      return { isLegendary: true, type: type };
    }
    
    // Check traffic threshold
    if (link.glowData && link.traffic) {
      if (link.traffic.load >= this.config.trafficThreshold) {
        return { isLegendary: true, type: 'QUANTUM_CROWN' };
      }
    }
    
    // Check synergy chain length
    if (link.glowData && link.glowData.synergy > 3) {
      return { isLegendary: true, type: 'FRACTAL' };
    }
    
    return { isLegendary: false, type: null };
  }
  
  /**
   * Get safe node identifier
   */
  getNodeId(node) {
    if (node.uuid) return node.uuid;
    if (node.userData && node.userData.nodeId) return node.userData.nodeId;
    return null;
  }
  
  /**
   * Make a link legendary
   */
  makeLegendaryLink(link, linkId, type, sourcePos, targetPos) {
    if (this.registry[linkId]) return;
    
    // Create external registry entry
    this.registry[linkId] = {
      isLegendary: true,
      type: type,
      intensity: 0,
      isFading: false,
      fadeTime: null,
      linkReference: link
    };
    
    // Create VFX container
    this.vfxContainers[linkId] = this.createLegendaryLinkVFXContainer(type, link);
    
    // Create spawn burst
    this.createLinkSpawnBurst(sourcePos, targetPos);
  }
  
  /**
   * Create legendary link VFX container
   */
  createLegendaryLinkVFXContainer(type, link) {
    const container = {
      type: type,
      bands: [],
      panels: [],
      particles: [],
      trails: [],
      frames: [],
      echoCurves: [],
      shockwaves: [],
      animationTime: 0
    };
    
    return container;
  }
  
  /**
   * Update legendary link VFX based on type
   */
  updateLegendaryLinkVFX(link, state, vfx, deltaTime) {
    vfx.animationTime += deltaTime;
    
    // Get curve points for positioning
    const curvePoints = this.getLinkCurvePoints(link, 8);
    
    switch(state.type) {
      case 'AURORA':
        this.updateAuroraLinkVFX(link, state, vfx, curvePoints, deltaTime);
        break;
      case 'FRACTAL':
        this.updateFractalLinkVFX(link, state, vfx, curvePoints, deltaTime);
        break;
      case 'SINGULARITY':
        this.updateSingularityLinkVFX(link, state, vfx, curvePoints, deltaTime);
        break;
      case 'SIGMA_PRIME':
        this.updateSigmaPrimeLinkVFX(link, state, vfx, curvePoints, deltaTime);
        break;
      case 'QUANTUM_CROWN':
        this.updateQuantumCrownLinkVFX(link, state, vfx, curvePoints, deltaTime);
        break;
    }
  }
  
  /**
   * Get evenly-spaced points along a link curve
   */
  getLinkCurvePoints(link, count) {
    if (!link.source || !link.target) return [];
    
    const points = [];
    const source = link.source.position;
    const target = link.target.position;
    
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const point = new THREE.Vector3();
      point.lerpVectors(source, target, t);
      points.push(point);
    }
    
    return points;
  }
  
  /**
   * AURORA LINK VFX - Color-cycling neon bands
   */
  updateAuroraLinkVFX(link, state, vfx, curvePoints, deltaTime) {
    const params = this.legendaryTypes.AURORA;
    
    // Create color-cycling bands
    while (vfx.bands.length < params.bandCount) {
      const bandIndex = vfx.bands.length;
      const color = params.colors[bandIndex % params.colors.length];
      
      const band = this.createAuroraBand(curvePoints, color, bandIndex);
      this.scene.add(band);
      vfx.bands.push(band);
    }
    
    // Update bands
    vfx.bands.forEach((band, idx) => {
      const colorIdx = (idx + Math.floor(vfx.animationTime)) % params.colors.length;
      const nextColorIdx = (colorIdx + 1) % params.colors.length;
      const colorT = (Math.sin(vfx.animationTime * 0.5) + 1) * 0.5;
      
      // Update band position
      band.children.forEach((mesh, pointIdx) => {
        if (pointIdx < curvePoints.length) {
          mesh.position.copy(curvePoints[pointIdx]);
          
          // Pulsing opacity
          const pulse = 0.3 + Math.sin(vfx.animationTime * params.pulseSpeed + pointIdx) * 0.4;
          mesh.material.opacity = pulse * state.intensity;
        }
      });
    });
  }
  
  /**
   * Create aurora band geometry
   */
  createAuroraBand(curvePoints, color, bandIndex) {
    const group = new THREE.Group();
    group.userData = { isLegendaryLinkVFX: true, type: 'aurora_band' };
    
    // Create small spheres along the curve
    curvePoints.forEach((point, idx) => {
      const geo = new THREE.SphereGeometry(0.08, 6, 6);
      const mat = this.getMaterial(
        `aurora-band-${color}`,
        () => new THREE.MeshStandardMaterial({
          color: color,
          transparent: true,
          emissive: color,
          emissiveIntensity: 0.6,
          fog: false
        })
      );
      
      const mesh = new THREE.Mesh(geo, mat);
      tagAllowedSphere(mesh, { role: 'vfx', source: 'SafeLegendaryLinkFX' });
      clampSphere(mesh);
      mesh.position.copy(point);
      const scaleAmount = 0.5 + bandIndex * 0.2;
      mesh.scale.multiplyScalar(scaleAmount);
      group.add(mesh);
    });
    
    return group;
  }
  
  /**
   * FRACTAL LINK VFX - Hologram panels and shards
   */
  updateFractalLinkVFX(link, state, vfx, curvePoints, deltaTime) {
    const params = this.legendaryTypes.FRACTAL;
    
    // Create fractal panels along link
    while (vfx.panels.length < params.panelCount) {
      const panelIndex = vfx.panels.length;
      const panel = this.createFractalPanel(curvePoints, panelIndex, params);
      this.scene.add(panel);
      vfx.panels.push({ mesh: panel, index: panelIndex });
    }
    
    // Update panels
    vfx.panels.forEach((panelData, idx) => {
      const panel = panelData.mesh;
      const pointIdx = Math.floor((idx / vfx.panels.length) * curvePoints.length);
      
      if (pointIdx < curvePoints.length) {
        panel.position.copy(curvePoints[pointIdx]);
        
        // Rotation shimmer
        panel.rotation.x += deltaTime * 0.5 * state.intensity;
        panel.rotation.y += deltaTime * 0.3 * state.intensity;
        
        // Pulsing opacity
        const pulse = 0.2 + Math.sin(vfx.animationTime * 2 + idx) * 0.3 + state.intensity * 0.3;
        panel.material.opacity = pulse;
      }
    });
    
    // Create orbiting shards if needed
    while (vfx.particles.length < params.shardCount) {
      const shard = this.createFractalShard(params);
      this.scene.add(shard);
      vfx.particles.push({
        mesh: shard,
        angle: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 2,
        pointIndex: Math.floor(Math.random() * curvePoints.length)
      });
    }
    
    // Update shards
    vfx.particles.forEach((shardData, idx) => {
      shardData.angle += shardData.speed * deltaTime * 0.5;
      
      if (shardData.pointIndex < curvePoints.length) {
        const radius = 0.3 + Math.sin(vfx.animationTime + idx) * 0.2;
        const x = Math.cos(shardData.angle) * radius;
        const z = Math.sin(shardData.angle) * radius;
        
        shardData.mesh.position.copy(curvePoints[shardData.pointIndex]);
        shardData.mesh.position.x += x;
        shardData.mesh.position.z += z;
        
        shardData.mesh.material.opacity = 0.4 * state.intensity;
      }
    });
  }
  
  /**
   * Create fractal panel
   */
  createFractalPanel(curvePoints, index, params) {
    // Octahedron diamond instead of flat square
    const geo = new THREE.OctahedronGeometry(0.16, 0);
    const mat = this.getMaterial(
      `fractal-panel-${params.panelColor}`,
      () => new THREE.MeshStandardMaterial({
        color: params.panelColor,
        transparent: true,
        emissive: params.panelColor,
        emissiveIntensity: 0.5,
        fog: false
      })
    );
    
    const panel = new THREE.Mesh(geo, mat);
    panel.userData = { isLegendaryLinkVFX: true, type: 'fractal_panel' };
    
    return panel;
  }
  
  /**
   * Create fractal shard
   */
  createFractalShard(params) {
    const geo = new THREE.TetrahedronGeometry(0.06, 1);
    const mat = this.getMaterial(
      `fractal-shard-${params.primaryColor}`,
      () => new THREE.MeshStandardMaterial({
        color: params.primaryColor,
        transparent: true,
        emissive: params.primaryColor,
        emissiveIntensity: 0.7,
        fog: false
      })
    );
    
    const shard = new THREE.Mesh(geo, mat);
    shard.userData = { isLegendaryLinkVFX: true, type: 'fractal_shard' };
    
    return shard;
  }
  
  /**
   * SINGULARITY LINK VFX - Distortion and trails
   */
  updateSingularityLinkVFX(link, state, vfx, curvePoints, deltaTime) {
    const params = this.legendaryTypes.SINGULARITY;
    
    // Create distortion trails
    while (vfx.trails.length < 2) {
      const trail = this.createSingularityTrail(curvePoints, params);
      this.scene.add(trail);
      vfx.trails.push(trail);
    }
    
    // Update trails
    vfx.trails.forEach((trail, idx) => {
      trail.children.forEach((mesh, pointIdx) => {
        if (pointIdx < curvePoints.length) {
          mesh.position.copy(curvePoints[pointIdx]);
          
          // Pulsing glow
          const pulse = 0.2 + Math.sin(vfx.animationTime * 1.5 + pointIdx + idx) * 0.3;
          mesh.material.opacity = pulse * state.intensity;
          // FIX: Only update emissive on materials that support it
          if (this.ensureEmissiveSafe(mesh.material)) {
            mesh.material.emissiveIntensity = 0.4 + state.intensity * 0.6;
          }
        }
      });
    });
    
    // Create expanding shockwaves along the link
    if (vfx.shockwaves.length === 0) {
      for (let i = 0; i < 3; i++) {
        const shockwave = {
          position: 0,
          speed: 0.5 + i * 0.15,
          meshes: []
        };
        
        // Create shockwave mesh points
        curvePoints.forEach(point => {
          const geo = new THREE.SphereGeometry(0.06, 6, 6);
          const mat = this.getMaterial(
            `shockwave-${params.shockwaveColor}`,
            () => new THREE.MeshStandardMaterial({
              color: params.shockwaveColor,
              transparent: true,
              emissive: params.shockwaveColor,
              emissiveIntensity: 0.8,
              fog: false
            })
          );
          
          const mesh = new THREE.Mesh(geo, mat);
      tagAllowedSphere(mesh, { role: 'vfx', source: 'SafeLegendaryLinkFX' });
      clampSphere(mesh);
          mesh.position.copy(point);
          this.scene.add(mesh);
          shockwave.meshes.push(mesh);
        });
        
        vfx.shockwaves.push(shockwave);
      }
    }
    
    // Update shockwaves
    vfx.shockwaves.forEach((shockwave, idx) => {
      shockwave.position = (shockwave.position + shockwave.speed * deltaTime) % 1.0;
      
      shockwave.meshes.forEach((mesh, pointIdx) => {
        // Scale based on position
        const distFromWave = Math.abs(shockwave.position - (pointIdx / shockwave.meshes.length));
        const scale = Math.max(0, 1.0 - distFromWave * 2.0);
        mesh.scale.setScalar(0.5 + scale * 0.5);
        
        mesh.material.opacity = scale * 0.6 * state.intensity;
      });
    });
  }
  
  /**
   * Create singularity trail
   */
  createSingularityTrail(curvePoints, params) {
    const group = new THREE.Group();
    group.userData = { isLegendaryLinkVFX: true, type: 'singularity_trail' };
    
    curvePoints.forEach(point => {
      const geo = new THREE.SphereGeometry(0.05, 6, 6);
      const mat = this.getMaterial(
        `singularity-trail-${params.trailColor}`,
        () => new THREE.MeshStandardMaterial({
          color: params.trailColor,
          transparent: true,
          emissive: params.trailColor,
          emissiveIntensity: 0.5,
          fog: false
        })
      );
      
      const mesh = new THREE.Mesh(geo, mat);
      tagAllowedSphere(mesh, { role: 'vfx', source: 'SafeLegendaryLinkFX' });
      clampSphere(mesh);
      mesh.position.copy(point);
      group.add(mesh);
    });
    
    return group;
  }
  
  /**
   * SIGMA_PRIME LINK VFX - Glitch and sparks
   */
  updateSigmaPrimeLinkVFX(link, state, vfx, curvePoints, deltaTime) {
    const params = this.legendaryTypes.SIGMA_PRIME;
    
    // Create glitch frames at high-traffic points
    while (vfx.frames.length < Math.ceil(params.sparkCount * 0.6)) {
      const frame = this.createSigmaFrame(curvePoints, params);
      this.scene.add(frame);
      vfx.frames.push({ mesh: frame, pointIndex: Math.floor(Math.random() * curvePoints.length) });
    }
    
    // Update frames
    vfx.frames.forEach((frameData, idx) => {
      if (frameData.pointIndex < curvePoints.length) {
        frameData.mesh.position.copy(curvePoints[frameData.pointIndex]);
        
        // Glitch effect
        if (Math.random() < 0.3 * state.intensity) {
          frameData.mesh.position.x += (Math.random() - 0.5) * 0.08;
          frameData.mesh.position.y += (Math.random() - 0.5) * 0.08;
        }
        
        // Pulsing opacity
        const pulse = 0.3 + Math.sin(vfx.animationTime * 3) * 0.3;
        frameData.mesh.material.opacity = pulse * state.intensity;
      }
    });
    
    // Create orbiting sparks
    while (vfx.particles.length < params.sparkCount) {
      const spark = this.createSigmaSpark(params);
      this.scene.add(spark);
      vfx.particles.push({
        mesh: spark,
        angle: Math.random() * Math.PI * 2,
        speed: 2 + Math.random() * 3,
        pointIndex: Math.floor(Math.random() * curvePoints.length)
      });
    }
    
    // Update sparks
    vfx.particles.forEach((sparkData, idx) => {
      sparkData.angle += sparkData.speed * deltaTime * 0.5;
      
      if (sparkData.pointIndex < curvePoints.length) {
        const radius = 0.2 + Math.sin(vfx.animationTime + idx) * 0.15;
        const x = Math.cos(sparkData.angle) * radius;
        const z = Math.sin(sparkData.angle) * radius;
        
        sparkData.mesh.position.copy(curvePoints[sparkData.pointIndex]);
        sparkData.mesh.position.x += x;
        sparkData.mesh.position.z += z;
        sparkData.mesh.position.y += Math.sin(vfx.animationTime * 2 + idx) * 0.1;
        
        sparkData.mesh.material.opacity = 0.7 * state.intensity;
      }
    });
  }
  
  /**
   * Create sigma glitch frame
   */
  createSigmaFrame(curvePoints, params) {
    // Tetrahedron shard instead of flat square
    const geo = new THREE.TetrahedronGeometry(0.14, 0);
    const mat = this.getMaterial(
      `sigma-frame-${params.frameColor}`,
      () => new THREE.MeshStandardMaterial({
        color: params.frameColor,
        transparent: true,
        emissive: params.frameColor,
        emissiveIntensity: 0.6,
        fog: false
      })
    );
    
    const frame = new THREE.Mesh(geo, mat);
    frame.userData = { isLegendaryLinkVFX: true, type: 'sigma_frame' };
    
    return frame;
  }
  
  /**
   * Create sigma spark
   */
  createSigmaSpark(params) {
    const geo = new THREE.SphereGeometry(0.04, 6, 6);
    const mat = this.getMaterial(
      `sigma-spark-${params.glitchColor}`,
      () => new THREE.MeshStandardMaterial({
        color: params.glitchColor,
        transparent: true,
        emissive: params.glitchColor,
        emissiveIntensity: 1.0,
        fog: false
      })
    );
    
    const spark = new THREE.Mesh(geo, mat);
    tagAllowedSphere(spark, { role: 'vfx', source: 'SafeLegendaryLinkFX' });
    clampSphere(spark);
    spark.userData = { isLegendaryLinkVFX: true, type: 'sigma_spark' };
    
    return spark;
  }
  
  /**
   * QUANTUM_CROWN LINK VFX - Spectral and echoes
   */
  updateQuantumCrownLinkVFX(link, state, vfx, curvePoints, deltaTime) {
    const params = this.legendaryTypes.QUANTUM_CROWN;
    
    // Create spectral color bands
    while (vfx.bands.length < params.spectrumColors.length) {
      const bandIndex = vfx.bands.length;
      const color = params.spectrumColors[bandIndex % params.spectrumColors.length];
      
      const band = this.createQuantumBand(curvePoints, color);
      this.scene.add(band);
      vfx.bands.push(band);
    }
    
    // Update spectral bands
    vfx.bands.forEach((band, idx) => {
      band.children.forEach((mesh, pointIdx) => {
        if (pointIdx < curvePoints.length) {
          mesh.position.copy(curvePoints[pointIdx]);
          
          // Spectral pulse
          const pulse = 0.2 + Math.sin(vfx.animationTime * params.pulseFrequency + idx) * 0.3;
          mesh.material.opacity = pulse * state.intensity;
          
          // Slight offset for spectrum effect
          const offset = (idx / params.spectrumColors.length) * 0.3;
          mesh.position.y += Math.sin(vfx.animationTime * 0.5 + offset) * 0.1;
        }
      });
    });
    
    // Create echo curves (phantom secondary paths)
    while (vfx.echoCurves.length < 2) {
      const echo = this.createQuantumEcho(curvePoints);
      this.scene.add(echo);
      vfx.echoCurves.push(echo);
    }
    
    // Update echo curves
    vfx.echoCurves.forEach((echo, idx) => {
      const offset = (idx + 1) * 0.15;
      
      echo.children.forEach((mesh, pointIdx) => {
        if (pointIdx < curvePoints.length) {
          // Offset from main curve
          mesh.position.copy(curvePoints[pointIdx]);
          mesh.position.x += Math.sin(vfx.animationTime * 0.3 + pointIdx) * offset;
          mesh.position.z += Math.cos(vfx.animationTime * 0.2 + pointIdx) * offset;
          
          mesh.material.opacity = params.echoOpacity * state.intensity;
        }
      });
    });
    
    // Create orbiting quantum particles
    while (vfx.particles.length < params.particleCount) {
      const particle = this.createQuantumParticle(params);
      this.scene.add(particle);
      vfx.particles.push({
        mesh: particle,
        angle: Math.random() * Math.PI * 2,
        elevation: Math.random() * Math.PI,
        speed: 0.5 + Math.random() * 1.0,
        pointIndex: Math.floor(Math.random() * curvePoints.length)
      });
    }
    
    // Update quantum particles
    vfx.particles.forEach((particleData, idx) => {
      particleData.angle += particleData.speed * deltaTime * 0.3;
      particleData.elevation += particleData.speed * deltaTime * 0.2;
      
      if (particleData.pointIndex < curvePoints.length) {
        const radius = 0.25;
        const x = Math.cos(particleData.angle) * Math.cos(particleData.elevation) * radius;
        const y = Math.sin(particleData.elevation) * radius;
        const z = Math.sin(particleData.angle) * Math.cos(particleData.elevation) * radius;
        
        particleData.mesh.position.copy(curvePoints[particleData.pointIndex]);
        particleData.mesh.position.x += x;
        particleData.mesh.position.y += y;
        particleData.mesh.position.z += z;
        
        particleData.mesh.material.opacity = 0.6 * state.intensity;
      }
    });
  }
  
  /**
   * Create quantum spectral band
   */
  createQuantumBand(curvePoints, color) {
    const group = new THREE.Group();
    group.userData = { isLegendaryLinkVFX: true, type: 'quantum_band' };
    
    curvePoints.forEach(point => {
      const geo = new THREE.SphereGeometry(0.06, 6, 6);
      const mat = this.getMaterial(
        `quantum-band-${color}`,
        () => new THREE.MeshStandardMaterial({
          color: color,
          transparent: true,
          emissive: color,
          emissiveIntensity: 0.5,
          fog: false
        })
      );
      
      const mesh = new THREE.Mesh(geo, mat);
      tagAllowedSphere(mesh, { role: 'vfx', source: 'SafeLegendaryLinkFX' });
      clampSphere(mesh);
      mesh.position.copy(point);
      group.add(mesh);
    });
    
    return group;
  }
  
  /**
   * Create quantum echo curve
   */
  createQuantumEcho(curvePoints) {
    const group = new THREE.Group();
    group.userData = { isLegendaryLinkVFX: true, type: 'quantum_echo' };
    
    curvePoints.forEach(point => {
      const geo = new THREE.SphereGeometry(0.04, 6, 6);
      const mat = this.getMaterial(
        'quantum-echo',
        () => new THREE.MeshStandardMaterial({
          color: 0x6f85bf,
          transparent: true,
          emissive: 0x6f85bf,
          emissiveIntensity: 0.18,
          fog: false
        })
      );
      
      const mesh = new THREE.Mesh(geo, mat);
      tagAllowedSphere(mesh, { role: 'vfx', source: 'SafeLegendaryLinkFX' });
      clampSphere(mesh);
      mesh.position.copy(point);
      group.add(mesh);
    });
    
    return group;
  }
  
  /**
   * Create quantum particle
   */
  createQuantumParticle(params) {
    const geo = new THREE.SphereGeometry(0.03, 6, 6);
    const mat = this.getMaterial(
      'quantum-particle',
      () => new THREE.MeshStandardMaterial({
        color: 0x7a69c0,
        transparent: true,
        emissive: 0x7a69c0,
        emissiveIntensity: 0.38,
        fog: false
      })
    );
    
    const particle = new THREE.Mesh(geo, mat);
    tagAllowedSphere(particle, { role: 'vfx', source: 'SafeLegendaryLinkFX' });
    clampSphere(particle);
    particle.userData = { isLegendaryLinkVFX: true, type: 'quantum_particle' };
    
    return particle;
  }
  
  /**
   * Update link intensity based on traffic and activity
   */
  updateLinkIntensity(state, link) {
    let intensity = 0;
    
    // Base intensity from traffic
    if (link.traffic && link.traffic.load) {
      intensity += Math.min(1, link.traffic.load * 0.3);
    }
    
    // Bonus from synergy
    if (link.glowData && link.glowData.synergy) {
      intensity += Math.min(0.5, link.glowData.synergy * 0.1);
    }
    
    // Smooth update
    state.intensity = Math.min(1, intensity);
  }
  
  /**
   * Create link spawn burst
   */
  createLinkSpawnBurst(sourcePos, targetPos) {
    // Burst at midpoint
    const midpoint = new THREE.Vector3();
    midpoint.addVectors(sourcePos, targetPos).multiplyScalar(0.5);
    
    const geo = new THREE.IcosahedronGeometry(0.2, 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xa0a9b8,
      transparent: true,
      emissive: 0xa0a9b8,
      emissiveIntensity: 0.45,
      fog: false
    });
    
    const burst = new THREE.Mesh(geo, mat);
    burst.position.copy(midpoint);
    burst.userData = {
      isLegendaryLinkVFX: true,
      isLinkBurst: true,
      startTime: performance.now(),
      duration: this.config.burstDuration
    };
    
    this.scene.add(burst);
    this.activeBursts.push(burst);
  }
  
  /**
   * Update burst effects
   */
  updateBursts(deltaTime) {
    this.activeBursts = this.activeBursts.filter(burst => {
      const elapsed = (performance.now() - burst.userData.startTime) * 0.001;
      const progress = Math.min(1, elapsed / burst.userData.duration);
      
      // Expand and fade
      burst.scale.setScalar(1 + progress * 1.5);
      burst.material.opacity = 1 - progress;
      
      if (progress >= 1) {
        this.scene.remove(burst);
        burst.geometry.dispose();
        burst.material.dispose();
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * De-legendaryify a link
   */
  deLegendaryLink(linkId) {
    const vfx = this.vfxContainers[linkId];
    if (!vfx) return;
    
    const state = this.registry[linkId];
    if (state) {
      state.isFading = true;
      state.fadeTime = performance.now();
    }
    
    // Clean up VFX with fade
    setTimeout(() => {
      this.cleanupLegendaryLinkVFX(linkId);
      delete this.registry[linkId];
      delete this.vfxContainers[linkId];
    }, this.config.fadeDuration * 1000);
  }
  
  /**
   * Clean up all VFX for a link
   */
  cleanupLegendaryLinkVFX(linkId) {
    const vfx = this.vfxContainers[linkId];
    if (!vfx) return;
    
    // Clean bands
    vfx.bands.forEach(band => {
      if (band.children) {
        band.children.forEach(child => {
          child.geometry.dispose();
          child.material.dispose();
        });
      }
      this.scene.remove(band);
    });
    
    // Clean panels
    vfx.panels.forEach(p => {
      if (p.mesh) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      }
    });
    
    // Clean particles
    vfx.particles.forEach(p => {
      if (p.mesh) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      }
    });
    
    // Clean trails
    vfx.trails.forEach(trail => {
      if (trail.children) {
        trail.children.forEach(child => {
          child.geometry.dispose();
          child.material.dispose();
        });
      }
      this.scene.remove(trail);
    });
    
    // Clean frames
    vfx.frames.forEach(f => {
      if (f.mesh) {
        this.scene.remove(f.mesh);
        f.mesh.geometry.dispose();
        f.mesh.material.dispose();
      }
    });
    
    // Clean echo curves
    vfx.echoCurves.forEach(echo => {
      if (echo.children) {
        echo.children.forEach(child => {
          child.geometry.dispose();
          child.material.dispose();
        });
      }
      this.scene.remove(echo);
    });
    
    // Clean shockwaves
    vfx.shockwaves.forEach(shock => {
      shock.meshes.forEach(mesh => {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
    });
  }
  
  /**
   * Find link in system by ID
   */
  findLinkById(linkId, links) {
    if (!links) return null;
    
    for (const link of links) {
      const id = this.getLinkId(link);
      if (id === linkId) return link;
    }
    
    return null;
  }
  
  /**
   * Get legendary link info
   */
  getLegendaryLinkInfo(linkId) {
    return this.registry[linkId] || null;
  }
  
  /**
   * Check if link is legendary
   */
  isLegendaryLink(linkId) {
    return !!this.registry[linkId];
  }
  
  /**
   * Get active legendary link count
   */
  getActiveLegendaryLinkCount() {
    return Object.keys(this.registry).length;
  }
  
  /**
   * Disable all legendary link effects (safe shutdown)
   */
  disableAll() {
    // Clean up all legendary links
    for (const linkId in this.vfxContainers) {
      this.cleanupLegendaryLinkVFX(linkId);
    }
    
    // Clean up bursts
    this.activeBursts.forEach(burst => {
      this.scene.remove(burst);
      burst.geometry.dispose();
      burst.material.dispose();
    });
    
    this.registry = {};
    this.vfxContainers = {};
    this.activeBursts = [];
  }
}


