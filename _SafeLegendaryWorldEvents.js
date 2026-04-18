import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { tagAllowedSphere, clampSphere } from './VisualSpherePolicy.js';
import { normalizeEnvironmentGeometry } from './RoundedEnvironmentGeometry.js';

// Legacy aura overlays kill-switch
const ENABLE_LEGACY_AURAS = false;
const LEGENDARY_MASK_CACHE = new Map();
const LEGENDARY_MASK_SIZE = 128;

function legendaryClamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function legendaryLerp(a, b, t) {
  return a + (b - a) * t;
}

function legendarySmoothstep(edge0, edge1, x) {
  if (edge0 === edge1) {
    return x < edge0 ? 0 : 1;
  }

  const t = legendaryClamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function legendaryHash2D(x, y, seed = 0) {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1442695041);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177);
  n = (n ^ (n >>> 16)) >>> 0;
  return n / 4294967295;
}

function legendaryValueNoise2D(x, y, seed = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const h00 = legendaryHash2D(xi, yi, seed);
  const h10 = legendaryHash2D(xi + 1, yi, seed);
  const h01 = legendaryHash2D(xi, yi + 1, seed);
  const h11 = legendaryHash2D(xi + 1, yi + 1, seed);

  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const x1 = legendaryLerp(h00, h10, u);
  const x2 = legendaryLerp(h01, h11, u);
  return legendaryLerp(x1, x2, v);
}

function legendaryFbm2D(x, y, seed = 0, octaves = 4) {
  let amplitude = 0.5;
  let frequency = 1.0;
  let total = 0;
  let normalizer = 0;

  for (let i = 0; i < octaves; i++) {
    total += legendaryValueNoise2D(x * frequency, y * frequency, seed + i * 13) * amplitude;
    normalizer += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return normalizer > 0 ? total / normalizer : 0;
}

function createLegendaryMaskTexture(kind, size = LEGENDARY_MASK_SIZE) {
  const cacheKey = `${kind}:${size}`;
  const cached = LEGENDARY_MASK_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  const data = new Uint8Array(size * size * 4);
  const inv = 1 / Math.max(1, size - 1);

  for (let y = 0; y < size; y++) {
    const v = y * inv * 2 - 1;

    for (let x = 0; x < size; x++) {
      const u = x * inv * 2 - 1;
      const radius = Math.sqrt(u * u + v * v);
      const angle = Math.atan2(v, u);
      let alpha = 0;

      switch (kind) {
        case 'cosmic_halo': {
          const core = 1 - legendarySmoothstep(0.0, 0.48, radius);
          const outer = 1 - legendarySmoothstep(0.58, 1.0, radius);
          const ringA = 1 - legendarySmoothstep(0.0, 0.06, Math.abs(radius - 0.42));
          const ringB = 1 - legendarySmoothstep(0.0, 0.04, Math.abs(radius - 0.72));
          const spokes = Math.pow(Math.max(0, Math.sin(angle * 7.0 + radius * 16.0)), 6);
          const shimmer = legendaryFbm2D(u * 4.0, v * 4.0, 11, 3);
          alpha = core * 0.28 + outer * 0.38 + ringA * 0.82 + ringB * 0.58 + spokes * 0.16 + shimmer * 0.12;
          break;
        }
        case 'aurora_curtain': {
          const heightWeight = legendarySmoothstep(-0.95, 0.55, v);
          const widthWeight = 1 - legendarySmoothstep(0.35, 1.0, Math.abs(u));
          const flow = 0.5 + 0.5 * Math.sin(u * 5.5 + v * 3.5 + legendaryFbm2D(u * 2.4, v * 2.4, 7, 3) * 2.0);
          const ribbon = Math.pow(flow, 1.8);
          const crest = Math.pow(0.5 + 0.5 * Math.sin(u * 15.0 + v * 4.5), 6);
          alpha = heightWeight * widthWeight * ribbon + crest * 0.14 * widthWeight;
          break;
        }
        case 'sigma_glitch': {
          const cellX = Math.floor((u + 1) * 18);
          const cellY = Math.floor((v + 1) * 24);
          const cellNoise = legendaryHash2D(cellX, cellY, 19);
          const scanline = 1 - legendarySmoothstep(0.08, 0.42, Math.abs(Math.sin((v + 1) * Math.PI * 21.0)));
          const fracture = 1 - legendarySmoothstep(0.18, 0.95, radius);
          const breach = Math.pow(0.5 + 0.5 * Math.sin(u * 20.0 + cellNoise * 12.0 + v * 8.0), 4);
          const block = cellNoise > 0.45 ? 1 : 0;
          alpha = fracture * (block * 0.68 + scanline * 0.38 + breach * 0.52);
          break;
        }
        case 'quantum_eclipse': {
          const core = 1 - legendarySmoothstep(0.0, 0.52, radius);
          const rim = 1 - legendarySmoothstep(0.0, 0.08, Math.abs(radius - 0.46));
          const shadow = 1 - legendarySmoothstep(0.66, 0.98, radius);
          const drift = legendaryFbm2D(u * 3.0, v * 3.0, 23, 3);
          alpha = core * 0.82 + rim * 0.9 + shadow * 0.18 + drift * 0.08;
          break;
        }
        case 'fractal_storm': {
          const warpA = legendaryFbm2D(u * 2.2 + 0.15, v * 2.2 - 0.35, 31, 4);
          const warpB = legendaryFbm2D((u + warpA * 0.4) * 5.5, (v - warpA * 0.35) * 5.5, 57, 3);
          const branches = Math.pow(Math.max(0, Math.sin((u * 9.0 + warpB * 2.0) + (v * 7.0 - warpA * 2.5))), 3.5);
          const radial = 1 - legendarySmoothstep(0.68, 1.0, radius);
          alpha = warpA * 0.22 + warpB * 0.36 + branches * 0.54 + radial * 0.22;
          break;
        }
        default:
          alpha = 0;
      }

      const idx = (y * size + x) * 4;
      const clamped = Math.round(legendaryClamp01(alpha) * 255);
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = clamped;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  LEGENDARY_MASK_CACHE.set(cacheKey, texture);
  return texture;
}

/**
 * SAFE LEGENDARY WORLD EVENTS PACK
 * 
 * ABSOLUTE SAFETY RULES - STRICTLY ENFORCED:
 * - ZERO shader modifications
 * - ZERO material modifications on existing objects
 * - ZERO Node or Link class modifications
 * - ZERO engine system replacements
 * - All effects are VFX overlays, world meshes, particles, or screen-space distortions
 * - All state stored ONLY in external LegendaryWorldEvents registry
 * - Completely non-invasive and reversible
 */

export class SafeLegendaryWorldEvents {
  constructor(scene, worldRoot, camera, renderer, useMetricTriggers = true) {
    this.scene = scene;
    this.worldRoot = worldRoot || scene;
    this.camera = camera;
    this.renderer = renderer;
    this.root = new THREE.Group();
    this.worldRoot.add(this.root);
    this.root.position.y = 15;

    this.worldOverlayRenderOrder = VisualHierarchyRegistry.getRenderOrder(
      VisualHierarchyRegistry.LAYER_WORLD_OVERLAY
    );
    this.root.renderOrder = this.worldOverlayRenderOrder;
    this.root.userData = this.root.userData || {};
    this.root.userData.__environmentLayerId = VisualHierarchyRegistry.LAYER_WORLD_OVERLAY;
    const originalRootAdd = this.root.add.bind(this.root);
    this.root.add = (...children) => {
      const result = originalRootAdd(...children);
      children.forEach((child) => this._applyWorldOverlayRenderOrder(child));
      return result;
    };

    // EXTERNAL STATE - Never touch engine internals
    this.registry = {
      activeEvent: null,
      timer: 0,
      intensity: 0,
      duration: 0,
      phase: 'idle', // idle, fadeIn, active, fadeOut
      seed: 0
    };
    
    // Event definitions
    this.eventTypes = {
      COSMIC_PULSE: {
        duration: 8.0,
        fadeInDuration: 1.0,
        fadeOutDuration: 2.0,
        maxIntensity: 1.0,
        color: 0x6deaff,
        description: 'Civilizational resonance bloom'
      },
      FRACTAL_STORM: {
        duration: 12.0,
        fadeInDuration: 1.5,
        fadeOutDuration: 3.0,
        maxIntensity: 0.9,
        color: 0xbc76ff,
        description: 'Recursive weather of living geometry'
      },
      SIGMA_INVASION: {
        duration: 10.0,
        fadeInDuration: 1.0,
        fadeOutDuration: 2.5,
        maxIntensity: 0.95,
        color: 0xff73cf,
        description: 'Controlled breach vector'
      },
      QUANTUM_ECLIPSE: {
        duration: 15.0,
        fadeInDuration: 2.0,
        fadeOutDuration: 3.5,
        maxIntensity: 0.85,
        color: 0xd07bff,
        description: 'Reality occluded by higher computation'
      },
      AURORA_STATE: {
        duration: 14.0,
        fadeInDuration: 2.0,
        fadeOutDuration: 3.0,
        maxIntensity: 0.8,
        color: 0x77f7db,
        description: 'Benevolent intelligence veil'
      }
    };
    
    // Configuration
    this.config = {
      eventCheckInterval: 5.0,            // Check every 5 seconds
      eventChance: 0.02,                  // 2% chance per check
      minLegendaryNodesForEvent: 0,       // Allow world events even without legacy legendary node pack
      maxConcurrentEvents: 1,             // Only 1 event at a time
      noEventCooldown: 30.0,              // 30 seconds between events
      eventInterpretationInterval: 0.25   // Phase B pilot: ~4 Hz semantic evaluation (visuals stay 60 Hz)
    };
    
    // Tracking
    this.lastEventCheck = performance.now();
    this.lastEventTime = 0;
    this.vfxContainer = {
      shockwaves: [],
      particles: [],
      meshes: [],
      trails: [],
      beams: [],
      overlays: [],
      distortionQuads: []
    };
    
    this.originalCameraFOV = this.camera.fov;
    this.originalCameraPosition = this.camera.position.clone();
    this.animationTime = 0;
    this.interpretationAccumulator = this.config.eventInterpretationInterval; // prime first tick
    this.pendingEvaluation = false; // explicit triggers can flip this to force evaluation before the interval
    this.suppressed = false;
    this.suppressedUntil = 0;
    this.metricBus = this._resolveMetricBus();
    this.legendaryMasks = this._createLegendaryMaskLibrary();
    this.legendaryPalettes = this._createLegendaryPaletteLibrary();
    if (useMetricTriggers) {
      this._setupMetricTriggers();
    }
  }
  
  /**
   * Main update loop (called once per frame)
   */
  update(deltaTime, legendaryPack, linkingSystem, evolutionManager) {
    this.animationTime += deltaTime;
    
    // Phase B pilot: hybrid model — visuals/FX stay 60 Hz, semantic detection runs on triggers + ~4 Hz safety net
    this.interpretationAccumulator += deltaTime;
    const shouldEvaluate =
      this.pendingEvaluation ||
      this.interpretationAccumulator >= this.config.eventInterpretationInterval;
    
    if (shouldEvaluate) {
      this.interpretationAccumulator = 0;
      this.pendingEvaluation = false;
      // Detection/decision path (meaning-level)
      this.checkEventTriggers(legendaryPack, linkingSystem, evolutionManager);
    }
    
    // Update active event if one is running
    if (this.registry.activeEvent) {
      this.updateActiveEvent(deltaTime, legendaryPack, linkingSystem);
    }
  }
  
  /**
   * Check if a new world event should trigger
   */
  checkEventTriggers(legendaryPack, linkingSystem, evolutionManager) {
    if (this._isSuppressed()) {
      return;
    }

    // Only check periodically
    const now = performance.now();
    if (now - this.lastEventCheck < this.config.eventCheckInterval * 1000) {
      return;
    }
    this.lastEventCheck = now;
    
    // Don't trigger if event is already active
    if (this.registry.activeEvent) return;
    
    // Check cooldown
    if (now - this.lastEventTime < this.config.noEventCooldown * 1000) {
      return;
    }
    
    // Need minimum legendary nodes or fallback network activity
    const legendaryCount = legendaryPack?.getActiveLegendaryCount?.() ?? this._inferLegendaryCount(linkingSystem, evolutionManager);
    if (legendaryCount < this.config.minLegendaryNodesForEvent) {
      return;
    }
    
    // Calculate event potential
    const potential = this.calculateEventPotential(legendaryCount, linkingSystem, evolutionManager);
    
    // Chance to trigger
    if (Math.random() < this.config.eventChance * potential) {
      this.triggerRandomEvent(legendaryCount, linkingSystem);
    }
  }

  _inferLegendaryCount(linkingSystem, evolutionManager) {
    let count = 0;
    const links = Array.isArray(linkingSystem?.links) ? linkingSystem.links : [];
    const strongSynergyLinks = links.filter(link => link?.glowData?.synergy > 0.15).length;

    if (links.length > 20) {
      count = Math.max(count, 1);
    }
    if (links.length > 45) {
      count = Math.max(count, 2);
    }
    if (strongSynergyLinks >= 3) {
      count = Math.max(count, 1);
    }
    if (strongSynergyLinks >= 8) {
      count = Math.max(count, 2);
    }

    const evolutionCount = evolutionManager?.registry
      ? Object.keys(evolutionManager.registry).length
      : 0;
    if (evolutionCount >= 5) {
      count = Math.max(count, 1);
    }
    if (evolutionCount >= 15) {
      count = Math.max(count, 2);
    }

    return Math.min(2, count);
  }

  _getWorldSpawnRadius() {
    const fallbackRadius = 280;
    if (!this.worldRoot) return fallbackRadius;

    const bounds = new THREE.Box3().setFromObject(this.worldRoot);
    if (bounds.isEmpty()) return fallbackRadius;

    const size = new THREE.Vector3();
    bounds.getSize(size);
    const maxExtent = Math.max(size.x, size.y, size.z, fallbackRadius);
    return Math.max(fallbackRadius, maxExtent * 0.7);
  }

  _getWorldSpawnPosition({ minHeight = 25, maxHeight = 80, minRadius = 60, maxRadius = null } = {}) {
    const radius = this._getWorldSpawnRadius();
    const spawnRadius = Math.min(maxRadius ?? radius, radius);
    const r = minRadius + Math.random() * Math.max(0, spawnRadius - minRadius);
    const angle = Math.random() * Math.PI * 2;

    return new THREE.Vector3(
      Math.cos(angle) * r,
      minHeight + Math.random() * (maxHeight - minHeight),
      Math.sin(angle) * r
    );
  }

  _applyWorldOverlayRenderOrder(object) {
    if (!object) return;
    const layerOrder = this.worldOverlayRenderOrder;

    const apply = (node) => {
      if (!node) return;
      if (typeof node.renderOrder === 'number') {
        node.renderOrder = Math.max(node.renderOrder, layerOrder);
      } else {
        node.renderOrder = layerOrder;
      }
      node.userData = node.userData || {};
      node.userData.__environmentLayerId = VisualHierarchyRegistry.LAYER_WORLD_OVERLAY;
    };

    if (typeof object.traverse === 'function') {
      object.traverse((node) => apply(node));
    } else {
      apply(object);
    }
  }

  _createLegendaryPaletteLibrary() {
    const voidDeep = new THREE.Color(0x08101a);
    const voidDeepCold = new THREE.Color(0x05131a);
    const coreWhite = new THREE.Color(0xf7fbff);
    const signalCyan = new THREE.Color(0x6deaff);
    const signalMint = new THREE.Color(0x77f7db);
    const signalViolet = new THREE.Color(0xd07bff);
    const signalRose = new THREE.Color(0xff73cf);

    return {
      COSMIC_PULSE: {
        base: signalCyan,
        accent: coreWhite,
        aura: new THREE.Color(0xcdfcff),
        deep: voidDeep,
        glow: new THREE.Color(0x4aa6ff)
      },
      AURORA_STATE: {
        base: signalMint,
        accent: coreWhite,
        aura: new THREE.Color(0xd6fff3),
        deep: voidDeepCold,
        glow: new THREE.Color(0x72c7ff)
      },
      SIGMA_INVASION: {
        base: signalRose,
        accent: coreWhite,
        aura: new THREE.Color(0xffd4ef),
        deep: new THREE.Color(0x150a16),
        glow: new THREE.Color(0x79fff1)
      },
      QUANTUM_ECLIPSE: {
        base: signalViolet,
        accent: coreWhite,
        aura: new THREE.Color(0xf0d6ff),
        deep: new THREE.Color(0x0c0816),
        glow: new THREE.Color(0x69dfff)
      },
      FRACTAL_STORM: {
        base: new THREE.Color(0xbc76ff),
        accent: coreWhite,
        aura: new THREE.Color(0xe8d0ff),
        deep: new THREE.Color(0x120a1a),
        glow: new THREE.Color(0x67f2ff)
      }
    };
  }

  _createLegendaryMaskLibrary() {
    return {
      cosmic: createLegendaryMaskTexture('cosmic_halo'),
      aurora: createLegendaryMaskTexture('aurora_curtain'),
      sigma: createLegendaryMaskTexture('sigma_glitch'),
      quantum: createLegendaryMaskTexture('quantum_eclipse'),
      fractal: createLegendaryMaskTexture('fractal_storm')
    };
  }

  _createLegendaryMeshMaterial({
    color,
    opacity = 1,
    map = null,
    blending = THREE.AdditiveBlending,
    depthWrite = false,
    depthTest = true,
    side = THREE.DoubleSide,
    transparent = true,
    fog = false
  }) {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent,
      opacity,
      blending,
      depthWrite,
      depthTest,
      side,
      fog,
      map
    });
    material.toneMapped = false;
    return material;
  }

  _createLegendaryLineMaterial({
    color,
    opacity = 1,
    blending = THREE.AdditiveBlending,
    depthWrite = false,
    depthTest = true,
    linewidth = 1
  }) {
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending,
      depthWrite,
      depthTest,
      linewidth
    });
    material.toneMapped = false;
    return material;
  }

  _createLegendaryMesh(geometry, material, userData = {}) {
    const mesh = new THREE.Mesh(normalizeEnvironmentGeometry(geometry), material);
    mesh.userData = {
      isLegendaryWorldVFX: true,
      ...userData
    };
    return mesh;
  }

  _createLegendaryLine(points, options = {}) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = this._createLegendaryLineMaterial(options);
    const line = new THREE.Line(geometry, material);
    line.userData = {
      isLegendaryWorldVFX: true,
      ...options.userData
    };
    return line;
  }

  _createLegendaryWireCage(geometry, options = {}) {
    const cageGeometry = new THREE.EdgesGeometry(geometry);
    const material = this._createLegendaryLineMaterial({
      color: options.color,
      opacity: options.opacity ?? 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: options.depthWrite ?? false,
      depthTest: options.depthTest ?? false,
      linewidth: options.linewidth ?? 1
    });
    const cage = new THREE.LineSegments(cageGeometry, material);
    cage.userData = {
      isLegendaryWorldVFX: true,
      type: options.type || 'legendary_cage',
      phaseOffset: options.phaseOffset ?? 0,
      baseOpacity: options.baseOpacity ?? (options.opacity ?? 0.18),
      baseScale: options.baseScale ?? 1
    };
    cage.position.copy(options.position || new THREE.Vector3());
    cage.rotation.copy(options.rotation || new THREE.Euler());
    cage.scale.setScalar(options.scale ?? 1);
    return cage;
  }

  _createLegendaryBackdropSheet({
    type,
    color,
    map = null,
    opacity = 0.12,
    width = 540,
    height = 240,
    position = new THREE.Vector3(),
    rotation = new THREE.Euler(),
    scale = 1,
    phaseOffset = 0,
    baseOpacity = opacity,
    baseScale = 1,
    blending = THREE.AdditiveBlending,
    depthWrite = false,
    depthTest = false,
    side = THREE.DoubleSide
  }) {
    const mesh = this._createLegendaryMesh(
      new THREE.PlaneGeometry(width, height),
      this._createLegendaryMeshMaterial({
        color,
        map,
        opacity,
        blending,
        depthWrite,
        depthTest,
        side
      }),
      {
        type,
        phaseOffset,
        baseOpacity,
        baseScale
      }
    );
    mesh.position.copy(position);
    mesh.rotation.copy(rotation);
    mesh.scale.setScalar(scale);
    return mesh;
  }

  _registerLegendaryObject(bucket, object) {
    if (!object) return object;

    const targetBucket = Array.isArray(this.vfxContainer?.[bucket]) ? this.vfxContainer[bucket] : this.vfxContainer.overlays;
    targetBucket.push(object);
    this.root.add(object);
    return object;
  }

  _getLegendaryBeat(speed = 1, offset = 0, floor = 0.4, ceil = 1.0) {
    const wave = 0.5 + 0.5 * Math.sin(this.animationTime * speed + offset);
    return legendaryLerp(floor, ceil, wave);
  }

  _getLegendaryEventEnvelope(intensity, phase = 'active') {
    const rise = legendarySmoothstep(0.02, 0.28, intensity);
    const body = legendarySmoothstep(0.18, 0.72, intensity);
    const crest = legendarySmoothstep(0.58, 0.96, intensity);
    const tail = 1 - legendarySmoothstep(0.72, 1.0, intensity);
    const afterglowBase = phase === 'fadeOut'
      ? legendarySmoothstep(0.0, 1.0, tail)
      : legendarySmoothstep(0.34, 0.94, intensity) * 0.58;

    return {
      rise,
      body,
      crest,
      tail,
      afterglow: legendaryClamp01(afterglowBase),
      contrast: legendaryClamp01(0.38 + body * 0.38 + crest * 0.24)
    };
  }

  _getLegendaryHudPayload(eventType) {
    const text = {
      COSMIC_PULSE: {
        title: 'Cosmic Pulse',
        subtitle: 'Civilizational resonance bloom',
        description: 'A synchronized world heartbeat. The network settles into luminous coherence.'
      },
      AURORA_STATE: {
        title: 'Aurora State',
        subtitle: 'Benevolent intelligence veil',
        description: 'A calm intelligence curtain. The system breathes in ordered light.'
      },
      SIGMA_INVASION: {
        title: 'Sigma Invasion',
        subtitle: 'Controlled breach vector',
        description: 'A precise hostile intrusion. Glitch, fracture, and signal pressure take over the frame.'
      },
      QUANTUM_ECLIPSE: {
        title: 'Quantum Eclipse',
        subtitle: 'Reality occluded by higher computation',
        description: 'A phase shadow crosses the world. Light bends around a denser model of reality.'
      },
      FRACTAL_STORM: {
        title: 'Fractal Storm',
        subtitle: 'Recursive weather of living geometry',
        description: 'Self-similar turbulence fills the space. The world grows branching intelligence.'
      }
    };

    return text[eventType] || {
      title: eventType || 'Legendary Event',
      subtitle: 'ATOMA world event',
      description: 'Legendary overlay engaged.'
    };
  }
  
  /**
   * Calculate potential for an event to trigger
   */
  calculateEventPotential(legendaryCount, linkingSystem, evolutionManager) {
    let potential = 0;

    // Base from legendary nodes or fallback network presence
    potential += legendaryCount * 0.25;

    const links = Array.isArray(linkingSystem?.links) ? linkingSystem.links : [];
    const totalLinks = links.length;
    const strongSynergyLinks = links.filter(link => link?.glowData?.synergy > 0.15).length;

    if (totalLinks > 0) {
      const linkCountBonus = Math.min(0.35, totalLinks * 0.008);
      potential += linkCountBonus;
    }

    if (strongSynergyLinks > 0) {
      potential += Math.min(0.25, strongSynergyLinks * 0.08);
    }

    if (linkingSystem?.links) {
      let totalSynergy = 0;
      linkingSystem.links.forEach(link => {
        if (link.glowData && typeof link.glowData.synergy === 'number') {
          totalSynergy += link.glowData.synergy;
        }
      });
      potential += Math.min(0.2, totalSynergy * 0.04);
    }

    const evolutionCount = evolutionManager?.registry
      ? Object.keys(evolutionManager.registry).length
      : 0;
    if (evolutionCount > 0) {
      potential += Math.min(0.25, evolutionCount * 0.02);
    }

    // Guarantee some potential if network is active
    if (potential === 0 && totalLinks > 5) {
      potential = 0.1;
    }

    return Math.min(1, potential);
  }
  
  /**
   * Trigger a random world event
   */
  triggerRandomEvent(legendaryCount, linkingSystem) {
    const eventTypes = Object.keys(this.eventTypes);
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    this.startWorldEvent(eventType, legendaryCount, linkingSystem);
  }
  
  /**
   * Start a specific world event
   */
  startWorldEvent(eventType, legendaryCount, linkingSystem) {
    const eventDef = this.eventTypes[eventType];
    if (!eventDef) return;

    console.log('[WorldEvents] Starting event:', eventType, {
      legendaryCount,
      linkCount: Array.isArray(linkingSystem?.links) ? linkingSystem.links.length : 0,
      time: performance.now()
    });
    
    // Initialize registry
    this.registry.activeEvent = eventType;
    this.registry.timer = 0;
    this.registry.intensity = 0;
    this.registry.duration = eventDef.duration;
    this.registry.phase = 'fadeIn';
    this.registry.seed = Math.random() * Math.PI * 2;
    
    this.lastEventTime = performance.now();
    
    // Create initial VFX
    this.createEventVFX(eventType, eventDef);
  }
  
  /**
   * Create VFX for event type
   */
  createEventVFX(eventType, eventDef) {
    // Clear previous VFX
    this.cleanupAllVFX();
    
    switch(eventType) {
      case 'COSMIC_PULSE':
        this.createCosmicPulseVFX(eventDef);
        break;
      case 'FRACTAL_STORM':
        this.createFractalStormVFX(eventDef);
        break;
      case 'SIGMA_INVASION':
        this.createSigmaInvasionVFX(eventDef);
        break;
      case 'QUANTUM_ECLIPSE':
        this.createQuantumEclipseVFX(eventDef);
        break;
      case 'AURORA_STATE':
        this.createAuroraStateVFX(eventDef);
        break;
    }
  }
  
  /**
   * Update active world event
   */
  updateActiveEvent(deltaTime, legendaryPack, linkingSystem) {
    this.registry.timer += deltaTime;
    
    const eventDef = this.eventTypes[this.registry.activeEvent];
    if (!eventDef) {
      this.endWorldEvent();
      return;
    }
    
    // Calculate phase and intensity
    const fadeInDuration = eventDef.fadeInDuration;
    const activeStart = fadeInDuration;
    const activeEnd = fadeInDuration + (eventDef.duration - fadeInDuration - eventDef.fadeOutDuration);
    const fadeOutStart = activeEnd;
    const totalDuration = eventDef.duration;
    
    let intensity = 0;
    let phase = 'idle';
    
    if (this.registry.timer < fadeInDuration) {
      phase = 'fadeIn';
      intensity = (this.registry.timer / fadeInDuration) * eventDef.maxIntensity;
    } else if (this.registry.timer < fadeOutStart) {
      phase = 'active';
      intensity = eventDef.maxIntensity;
    } else if (this.registry.timer < totalDuration) {
      phase = 'fadeOut';
      const fadeOutTime = this.registry.timer - fadeOutStart;
      intensity = (1 - fadeOutTime / eventDef.fadeOutDuration) * eventDef.maxIntensity;
    } else {
      this.endWorldEvent();
      return;
    }
    
    this.registry.intensity = intensity;
    this.registry.phase = phase;
    
    // Update VFX based on event type
    switch(this.registry.activeEvent) {
      case 'COSMIC_PULSE':
        this.updateCosmicPulseVFX(intensity, deltaTime);
        break;
      case 'FRACTAL_STORM':
        this.updateFractalStormVFX(intensity, deltaTime);
        break;
      case 'SIGMA_INVASION':
        this.updateSigmaInvasionVFX(intensity, deltaTime);
        break;
      case 'QUANTUM_ECLIPSE':
        this.updateQuantumEclipseVFX(intensity, deltaTime);
        break;
      case 'AURORA_STATE':
        this.updateAuroraStateVFX(intensity, deltaTime);
        break;
    }
  }
  
  /**
   * COSMIC PULSE - Global shockwave event
   */
  createCosmicPulseVFX(eventDef) {
    const palette = this.legendaryPalettes.COSMIC_PULSE;
    const seed = this.registry.seed || 0;
    const haloTexture = this.legendaryMasks.cosmic;

    const core = this._createLegendaryMesh(
      new THREE.SphereGeometry(8, 24, 18),
      this._createLegendaryMeshMaterial({
        color: palette.base,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false
      }),
      {
        type: 'cosmic_core',
        phaseOffset: seed * 0.17,
        baseOpacity: 0.62
      }
    );
    core.position.set(0, 0, 0);
    tagAllowedSphere(core, { role: 'vfx', source: '_SafeLegendaryWorldEvents.js' });
    clampSphere(core);
    this._registerLegendaryObject('meshes', core);

    const resonanceCage = this._createLegendaryWireCage(
      new THREE.IcosahedronGeometry(13, 0),
      {
        type: 'cosmic_cage',
        color: palette.glow,
        opacity: 0.18,
        phaseOffset: seed * 0.29,
        baseOpacity: 0.18,
        baseScale: 1.08,
        scale: 1.08,
        depthWrite: false,
        depthTest: false
      }
    );
    resonanceCage.rotation.set(Math.PI * 0.28, Math.PI * 0.18, Math.PI * 0.08);
    this._registerLegendaryObject('meshes', resonanceCage);

    const innerRing = this._createLegendaryMesh(
      new THREE.TorusGeometry(18, 1.1, 16, 176),
      this._createLegendaryMeshMaterial({
        color: palette.accent,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      }),
      {
        type: 'cosmic_ring_inner',
        phaseOffset: seed * 0.21,
        baseScale: 1,
        baseOpacity: 0.72
      }
    );
    innerRing.rotation.x = Math.PI * 0.5;
    innerRing.rotation.z = Math.PI * 0.15;
    this._registerLegendaryObject('meshes', innerRing);

    const midRing = this._createLegendaryMesh(
      new THREE.TorusGeometry(30, 0.7, 14, 220),
      this._createLegendaryMeshMaterial({
        color: palette.aura,
        opacity: 0.46,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      }),
      {
        type: 'cosmic_ring_mid',
        phaseOffset: seed * 0.31,
        baseScale: 1,
        baseOpacity: 0.46
      }
    );
    midRing.rotation.y = Math.PI * 0.5;
    midRing.rotation.z = -Math.PI * 0.1;
    this._registerLegendaryObject('meshes', midRing);

    const outerRing = this._createLegendaryMesh(
      new THREE.TorusGeometry(44, 0.45, 12, 240),
      this._createLegendaryMeshMaterial({
        color: palette.glow,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      }),
      {
        type: 'cosmic_ring_outer',
        phaseOffset: seed * 0.43,
        baseScale: 1,
        baseOpacity: 0.32
      }
    );
    outerRing.rotation.x = Math.PI * 0.5;
    outerRing.rotation.z = Math.PI * 0.33;
    this._registerLegendaryObject('meshes', outerRing);

    const halo = this._createLegendaryMesh(
      new THREE.PlaneGeometry(480, 480),
      this._createLegendaryMeshMaterial({
        color: palette.aura,
        map: haloTexture,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      }),
      {
        type: 'cosmic_halo',
        phaseOffset: seed * 0.53,
        baseScale: 1,
        baseOpacity: 0.2
      }
    );
    halo.position.set(0, 24, -96);
    halo.rotation.x = -0.18;
    halo.rotation.z = 0.16;
    this._registerLegendaryObject('overlays', halo);

    const atmosphere = this._createLegendaryBackdropSheet({
      type: 'cosmic_atmosphere',
      color: palette.deep,
      map: haloTexture,
      opacity: 0.09,
      width: 640,
      height: 320,
      position: new THREE.Vector3(0, 18, -132),
      rotation: new THREE.Euler(-0.22, 0, 0.08),
      phaseOffset: seed * 0.61,
      baseOpacity: 0.09
    });
    this._registerLegendaryObject('overlays', atmosphere);

    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + seed * 0.1;
      const innerRadius = 10 + (i % 3) * 2;
      const outerRadius = 72 + (i % 4) * 6;
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          Math.cos(angle) * innerRadius,
          Math.sin(angle * 2.0 + seed) * 5,
          Math.sin(angle) * innerRadius
        ),
        new THREE.Vector3(
          Math.cos(angle) * outerRadius,
          Math.sin(angle * 2.0 + seed) * 9,
          Math.sin(angle) * outerRadius
        )
      ];

      const ray = this._createLegendaryLine(points, {
        color: palette.aura,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        linewidth: 1,
        userData: {
          type: 'cosmic_ray',
          index: i,
          phaseOffset: seed * 0.19 + i * 0.35,
          baseOpacity: 0.22
        }
      });
      this._registerLegendaryObject('beams', ray);
    }

    const moteGeometry = new THREE.SphereGeometry(0.42, 8, 8);
    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 2 + seed * 0.07;
      const orbitRadius = 28 + (i % 5) * 10 + (i % 2) * 6;
      const orbitHeight = Math.sin(angle * 2.0 + seed) * 9;
      const mote = this._createLegendaryMesh(
        moteGeometry.clone(),
        this._createLegendaryMeshMaterial({
          color: palette.base,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false
        }),
        {
          type: 'cosmic_mote',
          angle,
          orbitRadius,
          orbitHeight,
          orbitSpeed: 0.32 + (i % 4) * 0.06,
          baseScale: 0.72 + (i % 3) * 0.12,
          pulseOffset: seed * 0.2 + i * 0.45,
          baseOpacity: 0.5
        }
      );
      mote.position.set(
        Math.cos(angle) * orbitRadius,
        orbitHeight,
        Math.sin(angle) * orbitRadius
      );
      tagAllowedSphere(mote, { role: 'vfx', source: '_SafeLegendaryWorldEvents.js' });
      clampSphere(mote);
      this._registerLegendaryObject('particles', mote);
    }
  }
  
  /**
   * Update cosmic pulse VFX
   */
  updateCosmicPulseVFX(intensity, deltaTime) {
    const beat = this._getLegendaryBeat(0.85, this.registry.seed * 0.37, 0.65, 1.0);
    const envelope = this._getLegendaryEventEnvelope(intensity, this.registry.phase);
    const pulse = intensity * beat;
    const palette = this.legendaryPalettes.COSMIC_PULSE;

    for (let i = 0; i < this.vfxContainer.meshes.length; i++) {
      const mesh = this.vfxContainer.meshes[i];
      const type = mesh?.userData?.type;
      if (!type) continue;

      if (type === 'cosmic_core') {
        const coreScale = 1 + pulse * (0.46 + envelope.body * 0.18) + beat * 0.12 + envelope.crest * 0.06;
        mesh.scale.setScalar(coreScale);
        mesh.material.opacity = 0.4 + envelope.body * 0.28 + envelope.crest * 0.22 + pulse * 0.22;
        mesh.material.color.copy(palette.base).lerp(palette.accent, envelope.body * 0.42 + envelope.crest * 0.22 + beat * 0.12);
      } else if (type === 'cosmic_cage') {
        mesh.scale.setScalar(mesh.userData.baseScale * (1.02 + pulse * 0.28 + envelope.body * 0.08 + beat * 0.05));
        mesh.rotation.x += deltaTime * 0.2;
        mesh.rotation.y -= deltaTime * 0.16;
        mesh.rotation.z += deltaTime * 0.09;
        mesh.material.opacity = mesh.userData.baseOpacity * (0.58 + pulse * 0.86 + envelope.afterglow * 0.2 + beat * 0.1);
        mesh.material.color.copy(palette.glow).lerp(palette.accent, envelope.body * 0.22 + beat * 0.14);
      } else if (type === 'cosmic_ring_inner') {
        mesh.scale.setScalar((1 + pulse * (0.22 + envelope.body * 0.1)) * mesh.userData.baseScale);
        mesh.rotation.z += deltaTime * 0.35;
        mesh.material.opacity = mesh.userData.baseOpacity + envelope.body * 0.16 + envelope.afterglow * 0.12 + pulse * 0.14;
        mesh.material.color.copy(palette.accent).lerp(palette.aura, envelope.body * 0.28 + beat * 0.16);
      } else if (type === 'cosmic_ring_mid') {
        mesh.scale.setScalar((1 + pulse * (0.3 + envelope.crest * 0.12)) * mesh.userData.baseScale);
        mesh.rotation.z -= deltaTime * 0.24;
        mesh.material.opacity = mesh.userData.baseOpacity + envelope.body * 0.12 + envelope.afterglow * 0.1 + pulse * 0.1;
        mesh.material.color.copy(palette.aura).lerp(palette.glow, envelope.crest * 0.18 + beat * 0.14);
      } else if (type === 'cosmic_ring_outer') {
        mesh.scale.setScalar((1 + pulse * (0.38 + envelope.afterglow * 0.1)) * mesh.userData.baseScale);
        mesh.rotation.z += deltaTime * 0.18;
        mesh.material.opacity = mesh.userData.baseOpacity + envelope.afterglow * 0.16 + pulse * 0.08;
        mesh.material.color.copy(palette.glow).lerp(palette.accent, envelope.afterglow * 0.16 + beat * 0.12);
      }
    }

    for (let i = 0; i < this.vfxContainer.overlays.length; i++) {
      const overlay = this.vfxContainer.overlays[i];
      if (overlay?.userData?.type !== 'cosmic_halo') continue;

      overlay.scale.setScalar(1.08 + pulse * 0.82 + envelope.afterglow * 0.16 + beat * 0.12);
      overlay.rotation.z += deltaTime * 0.08;
      overlay.material.opacity = 0.1 + pulse * 0.2 + envelope.afterglow * 0.12 + beat * 0.04;
      overlay.material.color.copy(palette.aura).lerp(palette.accent, envelope.body * 0.24 + beat * 0.18);
    }

    for (let i = 0; i < this.vfxContainer.overlays.length; i++) {
      const overlay = this.vfxContainer.overlays[i];
      if (overlay?.userData?.type !== 'cosmic_atmosphere') continue;

      overlay.scale.setScalar(1 + pulse * 0.06 + envelope.afterglow * 0.05 + beat * 0.03);
      overlay.rotation.z += deltaTime * 0.01;
      overlay.material.opacity = overlay.userData.baseOpacity * (0.52 + pulse * 0.56 + envelope.afterglow * 0.28 + beat * 0.1);
      overlay.material.color.copy(palette.deep).lerp(palette.aura, envelope.afterglow * 0.2 + beat * 0.16 + pulse * 0.08);
    }

    for (let i = 0; i < this.vfxContainer.beams.length; i++) {
      const ray = this.vfxContainer.beams[i];
      if (ray?.userData?.type !== 'cosmic_ray') continue;

      const wave = 0.5 + 0.5 * Math.sin(this.animationTime * 1.55 + ray.userData.phaseOffset);
      ray.material.opacity = ray.userData.baseOpacity * (0.42 + wave * 0.68 + pulse * 0.28 + envelope.afterglow * 0.18);
      ray.material.color.copy(palette.aura).lerp(palette.accent, wave * 0.48 + envelope.crest * 0.16 + pulse * 0.12);
    }

    for (let i = 0; i < this.vfxContainer.particles.length; i++) {
      const mote = this.vfxContainer.particles[i];
      if (mote?.userData?.type !== 'cosmic_mote') continue;

      mote.userData.angle += mote.userData.orbitSpeed * deltaTime * 0.55;
      const drift = Math.sin(this.animationTime * 1.25 + mote.userData.pulseOffset) * 6 * pulse;
      const radius = mote.userData.orbitRadius + Math.sin(this.animationTime * 0.95 + mote.userData.pulseOffset) * 4 * intensity;
      mote.position.x = Math.cos(mote.userData.angle) * radius;
      mote.position.z = Math.sin(mote.userData.angle) * radius;
      mote.position.y = mote.userData.orbitHeight + drift;
      const moteScale = mote.userData.baseScale * (0.82 + beat * 0.4 + envelope.body * 0.12 + pulse * 0.16);
      mote.scale.setScalar(moteScale);
      mote.material.opacity = mote.userData.baseOpacity * (0.28 + beat * 0.42 + envelope.afterglow * 0.18 + pulse * 0.22);
      mote.material.color.copy(palette.base).lerp(palette.accent, beat * 0.5 + envelope.body * 0.16);
    }
  }
  
  /**
   * FRACTAL STORM - Fractal weather event
   */
  createFractalStormVFX(eventDef) {
    const palette = this.legendaryPalettes.FRACTAL_STORM;
    const seed = this.registry.seed || 0;
    const canopyTexture = this.legendaryMasks.fractal;

    const core = this._createLegendaryMesh(
      new THREE.SphereGeometry(5.5, 20, 16),
      this._createLegendaryMeshMaterial({
        color: palette.accent,
        opacity: 0.44,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false
      }),
      {
        type: 'fractal_core',
        phaseOffset: seed * 0.17,
        baseOpacity: 0.44
      }
    );
    core.position.set(0, 12, 0);
    tagAllowedSphere(core, { role: 'vfx', source: '_SafeLegendaryWorldEvents.js' });
    clampSphere(core);
    this._registerLegendaryObject('meshes', core);

    const growthCage = this._createLegendaryWireCage(
      new THREE.DodecahedronGeometry(9.5, 0),
      {
        type: 'fractal_cage',
        color: palette.aura,
        opacity: 0.14,
        phaseOffset: seed * 0.22,
        baseOpacity: 0.14,
        baseScale: 1.02,
        scale: 1.02,
        depthWrite: false,
        depthTest: false
      }
    );
    growthCage.position.set(0, 12, 0);
    growthCage.rotation.set(Math.PI * 0.18, Math.PI * 0.24, Math.PI * 0.07);
    this._registerLegendaryObject('meshes', growthCage);

    const ring = this._createLegendaryMesh(
      new THREE.RingGeometry(20, 34, 120),
      this._createLegendaryMeshMaterial({
        color: palette.glow,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      }),
      {
        type: 'fractal_ring',
        phaseOffset: seed * 0.29,
        baseOpacity: 0.24
      }
    );
    ring.position.set(0, 18, -8);
    ring.rotation.x = Math.PI * 0.5;
    ring.rotation.z = Math.PI * 0.15;
    this._registerLegendaryObject('meshes', ring);

    const canopy = this._createLegendaryMesh(
      new THREE.PlaneGeometry(520, 240),
      this._createLegendaryMeshMaterial({
        color: palette.deep,
        map: canopyTexture,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      }),
      {
        type: 'fractal_canopy',
        phaseOffset: seed * 0.43,
        baseOpacity: 0.18
      }
    );
    canopy.position.set(0, 56, -130);
    canopy.rotation.x = -0.22;
    canopy.rotation.z = 0.18;
    this._registerLegendaryObject('overlays', canopy);

    const atmosphere = this._createLegendaryBackdropSheet({
      type: 'fractal_cloud',
      color: palette.deep,
      map: canopyTexture,
      opacity: 0.08,
      width: 640,
      height: 260,
      position: new THREE.Vector3(0, 64, -156),
      rotation: new THREE.Euler(-0.2, 0, 0.1),
      phaseOffset: seed * 0.51,
      baseOpacity: 0.08
    });
    this._registerLegendaryObject('overlays', atmosphere);

    const branchCount = 7;
    for (let i = 0; i < branchCount; i++) {
      const branchAngle = (i / branchCount) * Math.PI * 2 + seed * 0.11;
      const branchTightness = 0.58 + (i % 3) * 0.13;
      const branchHeight = 18 + (i % 4) * 8;
      const points = [
        new THREE.Vector3(0, 12, 0),
        new THREE.Vector3(
          Math.cos(branchAngle) * 16,
          branchHeight + 4,
          Math.sin(branchAngle) * 16
        ),
        new THREE.Vector3(
          Math.cos(branchAngle * 1.35 + 0.7) * 28 * branchTightness,
          branchHeight + 18,
          Math.sin(branchAngle * 1.35 + 0.7) * 28 * branchTightness
        ),
        new THREE.Vector3(
          Math.cos(branchAngle * 1.9 + 1.4) * 42 * branchTightness,
          branchHeight + 34,
          Math.sin(branchAngle * 1.9 + 1.4) * 42 * branchTightness
        )
      ];

      const branch = this._createLegendaryLine(points, {
        color: i % 2 === 0 ? palette.aura : palette.glow,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        linewidth: 1,
        userData: {
          type: 'fractal_branch',
          index: i,
          phaseOffset: seed * 0.21 + i * 0.45,
          baseOpacity: 0.22
        }
      });
      this._registerLegendaryObject('beams', branch);
    }

    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2 + seed * 0.08;
      const orbitRadius = 22 + (i % 6) * 9 + (i % 2) * 3;
      const orbitHeight = 24 + Math.sin(angle * 2.0 + seed) * 16;
      const shardGeometry = new THREE.TetrahedronGeometry(0.55 + (i % 3) * 0.1, i % 2);
      const shard = this._createLegendaryMesh(
        shardGeometry,
        this._createLegendaryMeshMaterial({
          color: i % 2 === 0 ? palette.base : palette.aura,
          opacity: 0.38,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false
        }),
        {
          type: 'fractal_shard',
          angle,
          orbitRadius,
          orbitHeight,
          orbitSpeed: 0.24 + (i % 5) * 0.05,
          fallSpeed: 6 + (i % 4) * 2,
          wobbleSpeed: 0.95 + (i % 4) * 0.14,
          spinSpeed: 0.8 + (i % 6) * 0.1,
          baseScale: 0.75 + (i % 3) * 0.1,
          pulseOffset: seed * 0.13 + i * 0.27,
          baseOpacity: 0.38
        }
      );
      shard.position.set(
        Math.cos(angle) * orbitRadius,
        orbitHeight,
        Math.sin(angle) * orbitRadius
      );
      tagAllowedSphere(shard, { role: 'vfx', source: '_SafeLegendaryWorldEvents.js' });
      clampSphere(shard);
      this._registerLegendaryObject('particles', shard);
    }
  }
  
  /**
   * Update fractal storm VFX
   */
  updateFractalStormVFX(intensity, deltaTime) {
    const beat = this._getLegendaryBeat(0.92, this.registry.seed * 0.29, 0.7, 1.0);
    const envelope = this._getLegendaryEventEnvelope(intensity, this.registry.phase);
    const pulse = intensity * beat;
    const palette = this.legendaryPalettes.FRACTAL_STORM;

    for (let i = 0; i < this.vfxContainer.meshes.length; i++) {
      const mesh = this.vfxContainer.meshes[i];
      const type = mesh?.userData?.type;
      if (!type) continue;

      if (type === 'fractal_core') {
        mesh.scale.setScalar(1 + pulse * (0.36 + envelope.body * 0.16) + beat * 0.06 + envelope.crest * 0.04);
        mesh.material.opacity = mesh.userData.baseOpacity + envelope.body * 0.16 + envelope.crest * 0.18 + pulse * 0.16;
        mesh.material.color.copy(palette.accent).lerp(palette.glow, beat * 0.3 + envelope.body * 0.18);
      } else if (type === 'fractal_cage') {
        mesh.scale.setScalar(mesh.userData.baseScale * (1.01 + pulse * 0.22 + envelope.body * 0.08 + beat * 0.05));
        mesh.rotation.x += deltaTime * 0.14;
        mesh.rotation.y += deltaTime * 0.18;
        mesh.rotation.z -= deltaTime * 0.1;
        mesh.material.opacity = mesh.userData.baseOpacity * (0.56 + pulse * 0.82 + envelope.afterglow * 0.18 + beat * 0.08);
        mesh.material.color.copy(palette.aura).lerp(palette.accent, envelope.body * 0.2 + beat * 0.12);
      } else if (type === 'fractal_ring') {
        mesh.rotation.z += deltaTime * 0.22;
        mesh.scale.setScalar(1 + pulse * (0.14 + envelope.afterglow * 0.08));
        mesh.material.opacity = mesh.userData.baseOpacity + envelope.body * 0.12 + envelope.afterglow * 0.16 + pulse * 0.12;
        mesh.material.color.copy(palette.glow).lerp(palette.aura, beat * 0.34 + envelope.afterglow * 0.12);
      }
    }

    for (let i = 0; i < this.vfxContainer.overlays.length; i++) {
      const overlay = this.vfxContainer.overlays[i];
      if (overlay?.userData?.type !== 'fractal_canopy') continue;

      overlay.material.opacity = 0.07 + pulse * 0.18 + envelope.afterglow * 0.14 + beat * 0.04;
      overlay.rotation.z += deltaTime * 0.06 * intensity;
      overlay.scale.setScalar(1 + pulse * 0.06 + envelope.body * 0.05);
      overlay.material.color.copy(palette.deep).lerp(palette.aura, beat * 0.18 + envelope.afterglow * 0.1);
    }

    for (let i = 0; i < this.vfxContainer.overlays.length; i++) {
      const overlay = this.vfxContainer.overlays[i];
      if (overlay?.userData?.type !== 'fractal_cloud') continue;

      overlay.material.opacity = overlay.userData.baseOpacity * (0.42 + pulse * 0.7 + envelope.afterglow * 0.22 + beat * 0.14);
      overlay.rotation.z += deltaTime * 0.018;
      overlay.scale.setScalar(1 + pulse * 0.05 + envelope.body * 0.03);
      overlay.material.color.copy(palette.deep).lerp(palette.glow, beat * 0.16 + envelope.afterglow * 0.08 + pulse * 0.06);
    }

    for (let i = 0; i < this.vfxContainer.beams.length; i++) {
      const branch = this.vfxContainer.beams[i];
      if (branch?.userData?.type !== 'fractal_branch') continue;

      const wave = 0.5 + 0.5 * Math.sin(this.animationTime * 0.85 + branch.userData.phaseOffset);
      branch.rotation.z += deltaTime * (0.03 + branch.userData.index * 0.005);
      branch.material.opacity = branch.userData.baseOpacity * (0.36 + wave * 0.72 + pulse * 0.28 + envelope.afterglow * 0.14);
      branch.material.color.copy(palette.aura).lerp(palette.accent, wave * 0.28 + envelope.body * 0.16 + pulse * 0.1);
    }

    for (let i = 0; i < this.vfxContainer.particles.length; i++) {
      const shard = this.vfxContainer.particles[i];
      if (shard?.userData?.type !== 'fractal_shard') continue;

      shard.userData.angle += shard.userData.orbitSpeed * deltaTime * 0.55;
      shard.position.x = Math.cos(shard.userData.angle) * shard.userData.orbitRadius + Math.sin(this.animationTime * shard.userData.wobbleSpeed + shard.userData.pulseOffset) * pulse * 8;
      shard.position.z = Math.sin(shard.userData.angle) * shard.userData.orbitRadius + Math.cos(this.animationTime * shard.userData.wobbleSpeed + shard.userData.pulseOffset) * pulse * 8;
      shard.position.y -= shard.userData.fallSpeed * deltaTime * (0.62 + pulse * 0.38);
      shard.rotation.x += shard.userData.spinSpeed * deltaTime * 0.9;
      shard.rotation.y += shard.userData.spinSpeed * deltaTime * 0.7;
      shard.rotation.z += shard.userData.spinSpeed * deltaTime * 0.45;
      shard.scale.setScalar(shard.userData.baseScale * (0.8 + beat * 0.34 + envelope.body * 0.12 + pulse * 0.14));
      shard.material.opacity = shard.userData.baseOpacity * (0.26 + beat * 0.48 + envelope.afterglow * 0.16 + pulse * 0.24);
      shard.material.color.copy(palette.base).lerp(palette.accent, beat * 0.42 + envelope.body * 0.16);

      if (shard.position.y < -32) {
        shard.position.y = 42 + (shard.userData.orbitHeight % 18);
      }
    }
  }
  
  /**
   * SIGMA INVASION - Digital glitch surge
   */
  createSigmaInvasionVFX(eventDef) {
    const palette = this.legendaryPalettes.SIGMA_INVASION;
    const seed = this.registry.seed || 0;
    const glitchTexture = this.legendaryMasks.sigma;

    const breachPlane = this._createLegendaryMesh(
      new THREE.PlaneGeometry(540, 320),
      this._createLegendaryMeshMaterial({
        color: palette.deep,
        map: glitchTexture,
        opacity: 0.14,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      }),
      {
        type: 'sigma_breach',
        phaseOffset: seed * 0.15,
        baseOpacity: 0.14
      }
    );
    breachPlane.position.set(0, 0, -108);
    breachPlane.rotation.z = 0.02;
    this._registerLegendaryObject('overlays', breachPlane);

    const breachCage = this._createLegendaryWireCage(
      new THREE.OctahedronGeometry(12.5, 0),
      {
        type: 'sigma_cage',
        color: palette.glow,
        opacity: 0.16,
        phaseOffset: seed * 0.25,
        baseOpacity: 0.16,
        baseScale: 1.05,
        scale: 1.05,
        depthWrite: false,
        depthTest: false
      }
    );
    breachCage.position.set(0, 10, -108);
    breachCage.rotation.set(Math.PI * 0.2, Math.PI * 0.25, Math.PI * 0.1);
    this._registerLegendaryObject('meshes', breachCage);

    const shroud = this._createLegendaryBackdropSheet({
      type: 'sigma_shroud',
      color: palette.deep,
      map: glitchTexture,
      opacity: 0.08,
      width: 640,
      height: 360,
      position: new THREE.Vector3(0, 0, -152),
      rotation: new THREE.Euler(0, 0, -0.03),
      phaseOffset: seed * 0.59,
      baseOpacity: 0.08
    });
    this._registerLegendaryObject('overlays', shroud);

    for (let i = 0; i < 7; i++) {
      const band = this._createLegendaryMesh(
        new THREE.PlaneGeometry(520, 16),
        this._createLegendaryMeshMaterial({
          color: i % 2 === 0 ? palette.base : palette.glow,
          map: glitchTexture,
          opacity: 0.18,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
          side: THREE.DoubleSide
        }),
        {
          type: 'sigma_band',
          index: i,
          baseY: -48 + i * 16,
          phaseOffset: seed * 0.2 + i * 0.4,
          driftSpeed: 0.75 + (i % 3) * 0.08,
          baseRotation: (i % 2 === 0 ? 1 : -1) * 0.02,
          baseOpacity: 0.18
        }
      );
      band.position.set(0, band.userData.baseY, -99 + i * 0.4);
      this._registerLegendaryObject('overlays', band);
    }

    const fracturePositions = [-120, -42, 38, 118];
    for (let i = 0; i < fracturePositions.length; i++) {
      const fracture = this._createLegendaryMesh(
        new THREE.PlaneGeometry(176, 32),
        this._createLegendaryMeshMaterial({
          color: i % 2 === 0 ? palette.aura : palette.accent,
          map: glitchTexture,
          opacity: 0.2,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
          side: THREE.DoubleSide
        }),
        {
          type: 'sigma_fracture',
          index: i,
          baseX: fracturePositions[i],
          baseY: -6 + i * 7,
          baseZ: -92,
          baseRotation: -0.22 + i * 0.12,
          driftSpeed: 0.9 + i * 0.12,
          phaseOffset: seed * 0.31 + i * 0.7,
          baseOpacity: 0.2
        }
      );
      fracture.position.set(fracture.userData.baseX, fracture.userData.baseY, fracture.userData.baseZ);
      fracture.rotation.z = fracture.userData.baseRotation;
      this._registerLegendaryObject('overlays', fracture);
    }

    const needleCount = 8;
    for (let i = 0; i < needleCount; i++) {
      const angle = (i / needleCount) * Math.PI * 2 + seed * 0.08;
      const radius = 150 + (i % 3) * 12;
      const points = [
        new THREE.Vector3(
          Math.cos(angle) * radius,
          -32 + Math.sin(angle * 1.2 + seed) * 18,
          Math.sin(angle) * radius
        ),
        new THREE.Vector3(
          Math.cos(angle) * 28,
          Math.sin(angle * 1.6 + seed) * 8,
          Math.sin(angle) * 28
        ),
        new THREE.Vector3(
          Math.cos(angle) * (radius * 0.6),
          24 + Math.cos(angle * 1.4 + seed) * 16,
          Math.sin(angle) * (radius * 0.6)
        )
      ];

      const needle = this._createLegendaryLine(points, {
        color: i % 2 === 0 ? palette.glow : palette.accent,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        linewidth: 1,
        userData: {
          type: 'sigma_needle',
          index: i,
          phaseOffset: seed * 0.27 + i * 0.35,
          baseOpacity: 0.18
        }
      });
      this._registerLegendaryObject('beams', needle);
    }

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + seed * 0.13;
      const fragment = this._createLegendaryMesh(
        new THREE.BoxGeometry(4.5, 10 + (i % 3) * 2, 1.5),
        this._createLegendaryMeshMaterial({
          color: i % 2 === 0 ? palette.base : palette.glow,
          opacity: 0.28,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
          side: THREE.DoubleSide
        }),
        {
          type: 'sigma_fragment',
          index: i,
          angle,
          driftRadius: 48 + i * 12,
          driftSpeed: 4.5 + i * 0.7,
          riseSpeed: 1.2 + i * 0.2,
          spinSpeed: 1.2 + i * 0.12,
          phaseOffset: seed * 0.21 + i * 0.42,
          baseOpacity: 0.28
        }
      );
      fragment.position.set(
        Math.cos(angle) * fragment.userData.driftRadius,
        -18 + (i % 3) * 14,
        Math.sin(angle) * fragment.userData.driftRadius
      );
      fragment.rotation.z = angle * 0.35;
      this._registerLegendaryObject('meshes', fragment);
    }
  }
  
  /**
   * Update sigma invasion VFX
   */
  updateSigmaInvasionVFX(intensity, deltaTime) {
    const beat = this._getLegendaryBeat(1.28, this.registry.seed * 0.41, 0.58, 1.0);
    const envelope = this._getLegendaryEventEnvelope(intensity, this.registry.phase);
    const pulse = intensity * beat;
    const palette = this.legendaryPalettes.SIGMA_INVASION;

    for (let i = 0; i < this.vfxContainer.overlays.length; i++) {
      const overlay = this.vfxContainer.overlays[i];
      const type = overlay?.userData?.type;
      if (!type) continue;

      if (type === 'sigma_breach') {
        overlay.material.opacity = overlay.userData.baseOpacity + envelope.body * 0.18 + envelope.crest * 0.16 + pulse * 0.1;
        overlay.rotation.z = 0.02 + Math.sin(this.animationTime * 0.35 + overlay.userData.phaseOffset) * 0.02;
        overlay.material.color.copy(palette.deep).lerp(palette.glow, envelope.body * 0.22 + pulse * 0.12 + beat * 0.06);
      } else if (type === 'sigma_band') {
        const wave = 0.5 + 0.5 * Math.sin(this.animationTime * overlay.userData.driftSpeed + overlay.userData.phaseOffset);
        overlay.position.x = Math.sin(this.animationTime * 0.5 + overlay.userData.phaseOffset) * (6 + pulse * 14);
        overlay.position.y = overlay.userData.baseY + Math.cos(this.animationTime * 0.7 + overlay.userData.phaseOffset) * (1.2 + pulse * 3.4);
        overlay.rotation.z = overlay.userData.baseRotation + Math.sin(this.animationTime * 0.65 + overlay.userData.phaseOffset) * 0.045 * intensity;
        overlay.scale.setScalar(1 + wave * 0.05 + pulse * 0.08);
        overlay.material.opacity = overlay.userData.baseOpacity * (0.42 + wave * 0.78 + envelope.body * 0.14 + pulse * 0.32);
        overlay.material.color.copy(palette.base).lerp(palette.glow, wave * 0.36 + envelope.body * 0.16 + pulse * 0.18);
      } else if (type === 'sigma_fracture') {
        overlay.position.x = overlay.userData.baseX + Math.sin(this.animationTime * overlay.userData.driftSpeed + overlay.userData.phaseOffset) * (8 + pulse * 18);
        overlay.position.y = overlay.userData.baseY + Math.cos(this.animationTime * overlay.userData.driftSpeed * 0.85 + overlay.userData.phaseOffset) * (4 + pulse * 5);
        overlay.rotation.z = overlay.userData.baseRotation + Math.sin(this.animationTime * 1.15 + overlay.userData.phaseOffset) * (0.12 + pulse * 0.18);
        overlay.material.opacity = overlay.userData.baseOpacity * (0.32 + envelope.crest * 0.22 + pulse * 0.62);
        overlay.material.color.copy(palette.aura).lerp(palette.accent, pulse * 0.24 + envelope.crest * 0.16 + beat * 0.1);
      } else if (type === 'sigma_shroud') {
        overlay.scale.setScalar(1 + pulse * 0.05 + envelope.afterglow * 0.04 + beat * 0.02);
        overlay.rotation.z = Math.sin(this.animationTime * 0.08 + overlay.userData.phaseOffset) * 0.02;
        overlay.material.opacity = overlay.userData.baseOpacity * (0.38 + envelope.afterglow * 0.26 + pulse * 0.48 + beat * 0.1);
        overlay.material.color.copy(palette.deep).lerp(palette.aura, beat * 0.12 + envelope.afterglow * 0.1 + pulse * 0.06);
      }
    }

    for (let i = 0; i < this.vfxContainer.beams.length; i++) {
      const needle = this.vfxContainer.beams[i];
      if (needle?.userData?.type !== 'sigma_needle') continue;

      const wave = 0.5 + 0.5 * Math.sin(this.animationTime * 1.5 + needle.userData.phaseOffset);
      needle.position.y += Math.sin(this.animationTime * 0.5 + needle.userData.phaseOffset) * 0.06;
      needle.rotation.z += deltaTime * 0.035;
      needle.material.opacity = needle.userData.baseOpacity * (0.46 + wave * 0.72 + pulse * 0.36 + envelope.afterglow * 0.12);
      needle.material.color.copy(palette.glow).lerp(palette.accent, wave * 0.34 + envelope.crest * 0.16 + pulse * 0.12);
    }

    for (let i = 0; i < this.vfxContainer.meshes.length; i++) {
      const fragment = this.vfxContainer.meshes[i];
      const type = fragment?.userData?.type;
      if (!type) continue;

      if (type === 'sigma_cage') {
        fragment.scale.setScalar(fragment.userData.baseScale * (1.02 + pulse * 0.18 + envelope.body * 0.08 + beat * 0.05));
        fragment.rotation.x += deltaTime * 0.16;
        fragment.rotation.y -= deltaTime * (0.2 + pulse * 0.06);
        fragment.rotation.z += deltaTime * 0.12;
        fragment.material.opacity = fragment.userData.baseOpacity * (0.52 + pulse * 1.02 + envelope.afterglow * 0.16 + beat * 0.1);
        fragment.material.color.copy(palette.glow).lerp(palette.accent, envelope.body * 0.18 + pulse * 0.1);
      } else if (type !== 'sigma_fragment') {
        continue;
      }

      fragment.position.x += Math.cos(this.animationTime * 0.2 + fragment.userData.phaseOffset) * deltaTime * fragment.userData.driftSpeed * (0.4 + pulse * 0.8);
      fragment.position.z += Math.sin(this.animationTime * 0.24 + fragment.userData.phaseOffset) * deltaTime * fragment.userData.driftSpeed * (0.3 + pulse * 0.7);
      fragment.position.y += Math.sin(this.animationTime * 0.65 + fragment.userData.phaseOffset) * deltaTime * fragment.userData.riseSpeed * (0.5 + pulse * 0.8);
      fragment.rotation.x += fragment.userData.spinSpeed * deltaTime * 0.45;
      fragment.rotation.y += fragment.userData.spinSpeed * deltaTime * 0.33;
      fragment.rotation.z += fragment.userData.spinSpeed * deltaTime * 0.28;
      fragment.scale.setScalar(0.78 + pulse * 0.3 + envelope.body * 0.08 + beat * 0.1);
      fragment.material.opacity = fragment.userData.baseOpacity * (0.24 + beat * 0.42 + envelope.afterglow * 0.16 + pulse * 0.28);
      fragment.material.color.copy(palette.base).lerp(palette.glow, beat * 0.28 + envelope.body * 0.12 + pulse * 0.14);

      if (fragment.position.length() > 210) {
        fragment.position.set(
          Math.cos(fragment.userData.angle) * fragment.userData.driftRadius,
          -18 + (fragment.userData.index % 3) * 14,
          Math.sin(fragment.userData.angle) * fragment.userData.driftRadius
        );
      }
    }
  }
  
  /**
   * QUANTUM ECLIPSE - Dimensional shift
   */
  createQuantumEclipseVFX(eventDef) {
    const palette = this.legendaryPalettes.QUANTUM_ECLIPSE;
    const seed = this.registry.seed || 0;
    const eclipseTexture = this.legendaryMasks.quantum;

    const disc = this._createLegendaryMesh(
      new THREE.CircleGeometry(18, 64),
      this._createLegendaryMeshMaterial({
        color: palette.deep,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      }),
      {
        type: 'quantum_disc',
        phaseOffset: seed * 0.13,
        baseOpacity: 0.88
      }
    );
    disc.position.set(0, 80, -122);
    disc.rotation.x = -0.08;
    tagAllowedSphere(disc, { role: 'vfx', source: '_SafeLegendaryWorldEvents.js' });
    clampSphere(disc);
    this._registerLegendaryObject('meshes', disc);

    const innerRing = this._createLegendaryMesh(
      new THREE.RingGeometry(22, 28, 160),
      this._createLegendaryMeshMaterial({
        color: palette.accent,
        opacity: 0.56,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      }),
      {
        type: 'quantum_ring_inner',
        phaseOffset: seed * 0.21,
        baseOpacity: 0.56
      }
    );
    innerRing.position.set(0, 80, -120);
    innerRing.rotation.x = Math.PI * 0.5;
    innerRing.rotation.z = Math.PI * 0.12;
    this._registerLegendaryObject('meshes', innerRing);

    const outerRing = this._createLegendaryMesh(
      new THREE.RingGeometry(30, 36, 192),
      this._createLegendaryMeshMaterial({
        color: palette.glow,
        opacity: 0.34,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      }),
      {
        type: 'quantum_ring_outer',
        phaseOffset: seed * 0.29,
        baseOpacity: 0.34
      }
    );
    outerRing.position.set(0, 80, -120);
    outerRing.rotation.x = Math.PI * 0.5;
    outerRing.rotation.z = -Math.PI * 0.2;
    this._registerLegendaryObject('meshes', outerRing);

    const vignette = this._createLegendaryMesh(
      new THREE.PlaneGeometry(520, 320),
      this._createLegendaryMeshMaterial({
        color: palette.deep,
        map: eclipseTexture,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      }),
      {
        type: 'quantum_vignette',
        phaseOffset: seed * 0.37,
        baseOpacity: 0.16
      }
    );
    vignette.position.set(0, 78, -146);
    vignette.rotation.z = 0.02;
    this._registerLegendaryObject('overlays', vignette);

    const shadow = this._createLegendaryBackdropSheet({
      type: 'quantum_shadow',
      color: palette.deep,
      map: eclipseTexture,
      opacity: 0.09,
      width: 640,
      height: 360,
      position: new THREE.Vector3(0, 78, -166),
      rotation: new THREE.Euler(-0.06, 0, 0.01),
      phaseOffset: seed * 0.49,
      baseOpacity: 0.09
    });
    this._registerLegendaryObject('overlays', shadow);

    const rayCount = 12;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + seed * 0.06;
      const startRadius = 8 + (i % 3) * 2;
      const midRadius = 20 + (i % 4) * 3;
      const endRadius = 58 + (i % 5) * 5;
      const points = [
        new THREE.Vector3(
          Math.cos(angle) * startRadius,
          80 + Math.sin(angle * 2.0 + seed) * 4,
          Math.sin(angle) * startRadius - 122
        ),
        new THREE.Vector3(
          Math.cos(angle) * midRadius,
          54 + Math.cos(angle * 1.7 + seed) * 10,
          Math.sin(angle) * midRadius - 122
        ),
        new THREE.Vector3(
          Math.cos(angle) * endRadius,
          16 + Math.sin(angle * 1.5 + seed) * 14,
          Math.sin(angle) * endRadius - 122
        )
      ];

      const ray = this._createLegendaryLine(points, {
        color: i % 2 === 0 ? palette.accent : palette.glow,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        linewidth: 1,
        userData: {
          type: 'quantum_ray',
          index: i,
          phaseOffset: seed * 0.18 + i * 0.42,
          baseOpacity: 0.22
        }
      });
      this._registerLegendaryObject('beams', ray);
    }

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + seed * 0.12;
      const fragment = this._createLegendaryMesh(
        new THREE.TetrahedronGeometry(1.15 + (i % 3) * 0.08, 0),
        this._createLegendaryMeshMaterial({
          color: i % 2 === 0 ? palette.base : palette.aura,
          opacity: 0.34,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false
        }),
        {
          type: 'quantum_fragment',
          index: i,
          orbitAngle: angle,
          orbitRadius: 28 + i * 7,
          orbitSpeed: 0.2 + i * 0.045,
          orbitTilt: -4 + i * 1.4,
          phaseOffset: seed * 0.17 + i * 0.5,
          baseOpacity: 0.34,
          baseScale: 0.82 + (i % 3) * 0.08
        }
      );
      fragment.position.set(
        Math.cos(angle) * fragment.userData.orbitRadius,
        80 + fragment.userData.orbitTilt,
        Math.sin(angle) * fragment.userData.orbitRadius - 122
      );
      tagAllowedSphere(fragment, { role: 'vfx', source: '_SafeLegendaryWorldEvents.js' });
      clampSphere(fragment);
      this._registerLegendaryObject('particles', fragment);
    }
  }
  
  /**
   * Update quantum eclipse VFX
   */
  updateQuantumEclipseVFX(intensity, deltaTime) {
    const beat = this._getLegendaryBeat(0.74, this.registry.seed * 0.23, 0.62, 1.0);
    const envelope = this._getLegendaryEventEnvelope(intensity, this.registry.phase);
    const pulse = intensity * beat;
    const palette = this.legendaryPalettes.QUANTUM_ECLIPSE;

    for (let i = 0; i < this.vfxContainer.meshes.length; i++) {
      const mesh = this.vfxContainer.meshes[i];
      const type = mesh?.userData?.type;
      if (!type) continue;

      if (type === 'quantum_disc') {
        mesh.scale.setScalar(1 + pulse * (0.16 + envelope.body * 0.08) + beat * 0.06 + envelope.crest * 0.03);
        mesh.rotation.z += deltaTime * 0.03;
        mesh.material.opacity = mesh.userData.baseOpacity * (0.72 + envelope.body * 0.12 + envelope.crest * 0.1 + pulse * 0.08);
        mesh.material.color.copy(palette.deep).lerp(palette.base, envelope.body * 0.16 + pulse * 0.1 + beat * 0.06);
      } else if (type === 'quantum_ring_inner') {
        mesh.scale.setScalar(1 + pulse * (0.2 + envelope.body * 0.06));
        mesh.rotation.z += deltaTime * 0.12;
        mesh.material.opacity = mesh.userData.baseOpacity * (0.42 + envelope.body * 0.22 + envelope.crest * 0.18 + pulse * 0.24);
        mesh.material.color.copy(palette.accent).lerp(palette.glow, beat * 0.2 + envelope.body * 0.14);
      } else if (type === 'quantum_ring_outer') {
        mesh.scale.setScalar(1 + pulse * (0.26 + envelope.afterglow * 0.08));
        mesh.rotation.z -= deltaTime * 0.08;
        mesh.material.opacity = mesh.userData.baseOpacity * (0.32 + envelope.afterglow * 0.18 + pulse * 0.28);
        mesh.material.color.copy(palette.glow).lerp(palette.aura, beat * 0.24 + envelope.afterglow * 0.1);
      }
    }

    for (let i = 0; i < this.vfxContainer.overlays.length; i++) {
      const overlay = this.vfxContainer.overlays[i];
      if (overlay?.userData?.type !== 'quantum_vignette') continue;

      overlay.material.opacity = overlay.userData.baseOpacity * (0.36 + pulse * 0.72 + envelope.afterglow * 0.22 + beat * 0.14);
      overlay.rotation.z += deltaTime * 0.035;
      overlay.material.color.copy(palette.deep).lerp(palette.glow, pulse * 0.12 + envelope.afterglow * 0.08 + beat * 0.06);
    }

    for (let i = 0; i < this.vfxContainer.overlays.length; i++) {
      const overlay = this.vfxContainer.overlays[i];
      if (overlay?.userData?.type !== 'quantum_shadow') continue;

      overlay.material.opacity = overlay.userData.baseOpacity * (0.38 + pulse * 0.84 + beat * 0.2);
      overlay.rotation.z += deltaTime * 0.015;
      overlay.scale.setScalar(1 + pulse * 0.05 + beat * 0.03);
      overlay.material.color.copy(palette.deep).lerp(palette.aura, pulse * 0.12 + beat * 0.08);
    }

    for (let i = 0; i < this.vfxContainer.beams.length; i++) {
      const ray = this.vfxContainer.beams[i];
      if (ray?.userData?.type !== 'quantum_ray') continue;

      const wave = 0.5 + 0.5 * Math.sin(this.animationTime * 1.15 + ray.userData.phaseOffset);
      ray.material.opacity = ray.userData.baseOpacity * (0.38 + wave * 0.76 + pulse * 0.24 + envelope.afterglow * 0.16);
      ray.material.color.copy(palette.accent).lerp(palette.glow, wave * 0.34 + envelope.body * 0.12 + pulse * 0.08);
    }

    for (let i = 0; i < this.vfxContainer.particles.length; i++) {
      const fragment = this.vfxContainer.particles[i];
      if (fragment?.userData?.type !== 'quantum_fragment') continue;

      fragment.userData.orbitAngle += fragment.userData.orbitSpeed * deltaTime * 0.45;
      const radius = fragment.userData.orbitRadius + Math.sin(this.animationTime * 0.8 + fragment.userData.phaseOffset) * (2.5 + pulse * 8);
      fragment.position.x = Math.cos(fragment.userData.orbitAngle) * radius;
      fragment.position.z = Math.sin(fragment.userData.orbitAngle) * radius - 122;
      fragment.position.y = 80 + fragment.userData.orbitTilt + Math.sin(this.animationTime * 0.9 + fragment.userData.phaseOffset) * (4 + pulse * 7);
      fragment.rotation.x += deltaTime * 0.25;
      fragment.rotation.y += deltaTime * 0.31;
      fragment.rotation.z += deltaTime * 0.18;
      fragment.scale.setScalar(fragment.userData.baseScale * (0.86 + pulse * 0.28 + envelope.body * 0.08 + beat * 0.1));
      fragment.material.opacity = fragment.userData.baseOpacity * (0.3 + pulse * 0.56 + envelope.afterglow * 0.18 + beat * 0.12);
      fragment.material.color.copy(palette.base).lerp(palette.aura, beat * 0.34 + envelope.body * 0.12 + pulse * 0.08);
    }
  }
  
  /**
   * AURORA STATE - Global light ribbon event
   */
  createAuroraStateVFX(eventDef) {
    const palette = this.legendaryPalettes.AURORA_STATE;
    const seed = this.registry.seed || 0;
    const auroraTexture = this.legendaryMasks.aurora;

    const beacon = this._createLegendaryMesh(
      new THREE.SphereGeometry(5.6, 20, 16),
      this._createLegendaryMeshMaterial({
        color: palette.accent,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false
      }),
      {
        type: 'aurora_beacon',
        phaseOffset: seed * 0.15,
        baseOpacity: 0.42
      }
    );
    beacon.position.set(0, 34, -110);
    tagAllowedSphere(beacon, { role: 'vfx', source: '_SafeLegendaryWorldEvents.js' });
    clampSphere(beacon);
    this._registerLegendaryObject('meshes', beacon);

    const beaconRing = this._createLegendaryMesh(
      new THREE.RingGeometry(12, 16, 160),
      this._createLegendaryMeshMaterial({
        color: palette.glow,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      }),
      {
        type: 'aurora_ring',
        phaseOffset: seed * 0.27,
        baseOpacity: 0.24
      }
    );
    beaconRing.position.set(0, 34, -110);
    beaconRing.rotation.x = Math.PI * 0.5;
    beaconRing.rotation.z = Math.PI * 0.12;
    this._registerLegendaryObject('meshes', beaconRing);

    const veilSheet = this._createLegendaryMesh(
      new THREE.PlaneGeometry(540, 220),
      this._createLegendaryMeshMaterial({
        color: palette.deep,
        map: auroraTexture,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      }),
      {
        type: 'aurora_sheet',
        phaseOffset: seed * 0.33,
        baseOpacity: 0.12
      }
    );
    veilSheet.position.set(0, 28, -144);
    veilSheet.rotation.x = -0.2;
    veilSheet.rotation.z = 0.02;
    this._registerLegendaryObject('overlays', veilSheet);

    const crownSheet = this._createLegendaryMesh(
      new THREE.PlaneGeometry(420, 120),
      this._createLegendaryMeshMaterial({
        color: palette.base,
        map: auroraTexture,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide
      }),
      {
        type: 'aurora_crown',
        phaseOffset: seed * 0.41,
        baseOpacity: 0.16
      }
    );
    crownSheet.position.set(0, 46, -118);
    crownSheet.rotation.x = -0.14;
    crownSheet.rotation.z = -0.04;
    this._registerLegendaryObject('overlays', crownSheet);

    const skyVeil = this._createLegendaryBackdropSheet({
      type: 'aurora_sky',
      color: palette.deep,
      map: auroraTexture,
      opacity: 0.08,
      width: 640,
      height: 280,
      position: new THREE.Vector3(0, 22, -160),
      rotation: new THREE.Euler(-0.18, 0, 0.03),
      phaseOffset: seed * 0.47,
      baseOpacity: 0.08
    });
    this._registerLegendaryObject('overlays', skyVeil);

    const curtainPositions = [-112, -42, 36, 108];
    for (let i = 0; i < curtainPositions.length; i++) {
      const curtain = this._createLegendaryMesh(
        new THREE.PlaneGeometry(340, 148),
        this._createLegendaryMeshMaterial({
          color: i % 2 === 0 ? palette.base : palette.aura,
          map: auroraTexture,
          opacity: 0.16,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
          side: THREE.DoubleSide
        }),
        {
          type: 'aurora_curtain',
          index: i,
          baseX: curtainPositions[i],
          baseY: 30 + i * 5,
          baseZ: -116 - i * 7,
          phaseOffset: seed * 0.2 + i * 0.5,
          waveSpeed: 0.52 + i * 0.06,
          swaySpeed: 0.28 + i * 0.03,
          baseOpacity: 0.16
        }
      );
      curtain.position.set(curtain.userData.baseX, curtain.userData.baseY, curtain.userData.baseZ);
      curtain.rotation.x = -0.16;
      curtain.rotation.z = -0.08 + i * 0.04;
      this._registerLegendaryObject('overlays', curtain);
    }

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + seed * 0.09;
      const orbitRadius = 26 + (i % 5) * 9;
      const orbitHeight = 16 + Math.sin(angle * 2.0 + seed) * 8;
      const mote = this._createLegendaryMesh(
        new THREE.SphereGeometry(0.42, 8, 8),
        this._createLegendaryMeshMaterial({
          color: i % 2 === 0 ? palette.base : palette.accent,
          opacity: 0.44,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false
        }),
        {
          type: 'aurora_particle',
          angle,
          orbitRadius,
          orbitHeight,
          orbitSpeed: 0.22 + (i % 4) * 0.05,
          riseSpeed: 0.58 + (i % 5) * 0.08,
          pulseOffset: seed * 0.18 + i * 0.35,
          baseScale: 0.72 + (i % 3) * 0.08,
          baseOpacity: 0.44
        }
      );
      mote.position.set(
        Math.cos(angle) * orbitRadius,
        orbitHeight,
        Math.sin(angle) * orbitRadius - 112
      );
      tagAllowedSphere(mote, { role: 'vfx', source: '_SafeLegendaryWorldEvents.js' });
      clampSphere(mote);
      this._registerLegendaryObject('particles', mote);
    }
  }
  
  /**
   * Update aurora state VFX
   */
  updateAuroraStateVFX(intensity, deltaTime) {
    const beat = this._getLegendaryBeat(0.58, this.registry.seed * 0.19, 0.72, 1.0);
    const envelope = this._getLegendaryEventEnvelope(intensity, this.registry.phase);
    const pulse = intensity * beat;
    const palette = this.legendaryPalettes.AURORA_STATE;

    for (let i = 0; i < this.vfxContainer.meshes.length; i++) {
      const mesh = this.vfxContainer.meshes[i];
      const type = mesh?.userData?.type;
      if (!type) continue;

      if (type === 'aurora_beacon') {
        mesh.scale.setScalar(1 + pulse * (0.24 + envelope.body * 0.08) + beat * 0.08 + envelope.afterglow * 0.04);
        mesh.material.opacity = mesh.userData.baseOpacity * (0.58 + envelope.body * 0.22 + envelope.afterglow * 0.14 + pulse * 0.18);
        mesh.material.color.copy(palette.accent).lerp(palette.base, beat * 0.26 + envelope.body * 0.12);
      } else if (type === 'aurora_ring') {
        mesh.scale.setScalar(1 + pulse * (0.18 + envelope.body * 0.05));
        mesh.rotation.z += deltaTime * 0.08;
        mesh.material.opacity = mesh.userData.baseOpacity * (0.52 + envelope.body * 0.2 + envelope.afterglow * 0.12 + pulse * 0.22);
        mesh.material.color.copy(palette.glow).lerp(palette.accent, beat * 0.2 + envelope.afterglow * 0.08 + pulse * 0.08);
      }
    }

    for (let i = 0; i < this.vfxContainer.overlays.length; i++) {
      const overlay = this.vfxContainer.overlays[i];
      const type = overlay?.userData?.type;
      if (!type) continue;

      if (type === 'aurora_sheet') {
        overlay.material.opacity = overlay.userData.baseOpacity * (0.46 + pulse * 0.72 + envelope.afterglow * 0.2 + beat * 0.14);
        overlay.rotation.z += deltaTime * 0.025;
        overlay.scale.setScalar(1 + pulse * 0.06 + envelope.body * 0.04);
        overlay.material.color.copy(palette.deep).lerp(palette.aura, beat * 0.2 + envelope.afterglow * 0.08);
      } else if (type === 'aurora_crown') {
        overlay.material.opacity = overlay.userData.baseOpacity * (0.52 + pulse * 0.58 + envelope.body * 0.12 + beat * 0.12);
        overlay.rotation.z += deltaTime * 0.03;
        overlay.scale.setScalar(1 + pulse * 0.05 + envelope.afterglow * 0.03);
        overlay.material.color.copy(palette.base).lerp(palette.accent, beat * 0.2 + pulse * 0.12);
      } else if (type === 'aurora_curtain') {
        const wave = 0.5 + 0.5 * Math.sin(this.animationTime * overlay.userData.waveSpeed + overlay.userData.phaseOffset);
        const sway = Math.sin(this.animationTime * overlay.userData.swaySpeed + overlay.userData.phaseOffset) * (2 + pulse * 4);
        overlay.position.x = overlay.userData.baseX + sway;
        overlay.position.y = overlay.userData.baseY + Math.sin(this.animationTime * 0.45 + overlay.userData.phaseOffset) * (1.5 + pulse * 2.5);
        overlay.position.z = overlay.userData.baseZ + Math.cos(this.animationTime * 0.32 + overlay.userData.phaseOffset) * 2;
        overlay.rotation.z = (-0.08 + overlay.userData.index * 0.04) + Math.sin(this.animationTime * 0.18 + overlay.userData.phaseOffset) * 0.07;
        overlay.scale.setScalar(1 + wave * 0.04 + pulse * 0.06 + envelope.body * 0.03);
        overlay.material.opacity = overlay.userData.baseOpacity * (0.38 + wave * 0.72 + pulse * 0.28 + envelope.afterglow * 0.16);
        overlay.material.color.copy(palette.base).lerp(palette.accent, wave * 0.32 + pulse * 0.16 + envelope.afterglow * 0.08);
      } else if (type === 'aurora_sky') {
        overlay.material.opacity = overlay.userData.baseOpacity * (0.44 + pulse * 0.62 + envelope.afterglow * 0.2 + beat * 0.12);
        overlay.rotation.z += deltaTime * 0.012;
        overlay.scale.setScalar(1 + pulse * 0.04 + envelope.afterglow * 0.02);
        overlay.material.color.copy(palette.deep).lerp(palette.aura, beat * 0.16 + pulse * 0.08);
      }
    }

    for (let i = 0; i < this.vfxContainer.particles.length; i++) {
      const particle = this.vfxContainer.particles[i];
      if (particle?.userData?.type !== 'aurora_particle') continue;

      particle.userData.angle += particle.userData.orbitSpeed * deltaTime * 0.55;
      const radius = particle.userData.orbitRadius + Math.sin(this.animationTime * 0.8 + particle.userData.pulseOffset) * (6 + pulse * 6);
      particle.position.x = Math.cos(particle.userData.angle) * radius;
      particle.position.z = Math.sin(particle.userData.angle) * radius - 112;
      particle.position.y = particle.userData.orbitHeight + Math.sin(this.animationTime * particle.userData.riseSpeed + particle.userData.pulseOffset) * (8 + pulse * 10);
      particle.scale.setScalar(particle.userData.baseScale * (0.8 + beat * 0.36 + envelope.body * 0.1 + pulse * 0.14));
      particle.material.opacity = particle.userData.baseOpacity * (0.24 + beat * 0.5 + envelope.afterglow * 0.14 + pulse * 0.24);
      particle.material.color.copy(palette.base).lerp(palette.accent, beat * 0.38 + envelope.body * 0.12 + pulse * 0.08);
    }
  }
  
  /**
   * End the current world event
   */
  endWorldEvent() {
    this.cleanupAllVFX();
    this.registry.activeEvent = null;
    this.registry.timer = 0;
    this.registry.intensity = 0;
    this.registry.phase = 'idle';
    // Ensure we reevaluate promptly after an event finishes
    this.pendingEvaluation = true;
  }
  
  /**
   * Clean up all event VFX
   */
  cleanupAllVFX() {
    // Remove all meshes
    this.vfxContainer.meshes.forEach(mesh => {
      this.root.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    this.vfxContainer.meshes = [];
    
    // Remove all particles
    this.vfxContainer.particles.forEach(particle => {
      this.root.remove(particle);
      if (particle.geometry) particle.geometry.dispose();
      if (particle.material) particle.material.dispose();
    });
    this.vfxContainer.particles = [];
    
    // Remove all shockwaves
    this.vfxContainer.shockwaves.forEach(shock => {
      this.root.remove(shock.mesh);
      if (shock.mesh.geometry) shock.mesh.geometry.dispose();
      if (shock.mesh.material) shock.mesh.material.dispose();
    });
    this.vfxContainer.shockwaves = [];
    
    // Remove all beams
    this.vfxContainer.beams.forEach(beam => {
      this.root.remove(beam);
      if (beam.geometry) beam.geometry.dispose();
      if (beam.material) beam.material.dispose();
    });
    this.vfxContainer.beams = [];
    
    // Remove all overlays
    this.vfxContainer.overlays.forEach(overlay => {
      this.root.remove(overlay);
      if (overlay.geometry) overlay.geometry.dispose();
      if (overlay.material) overlay.material.dispose();
    });
    this.vfxContainer.overlays = [];
    
    // Remove all trails
    this.vfxContainer.trails.forEach(trail => {
      this.root.remove(trail);
      if (trail.geometry) trail.geometry.dispose();
      if (trail.material) trail.material.dispose();
    });
    this.vfxContainer.trails = [];
  }
  
  /**
   * Get event info for HUD display
   */
  getActiveEventInfo() {
    if (!this.registry.activeEvent) return null;
    
    const eventDef = this.eventTypes[this.registry.activeEvent];
    const hudText = this._getLegendaryHudPayload(this.registry.activeEvent);
    return {
      name: hudText.title,
      title: hudText.title,
      subtitle: hudText.subtitle,
      description: hudText.description,
      intensity: this.registry.intensity,
      phase: this.registry.phase,
      visualTone: hudText.subtitle
    };
  }
  
  /**
   * Check if event is active
   */
  isEventActive() {
    return !!this.registry.activeEvent;
  }
  
  /**
   * Get active event type
   */
  getActiveEventType() {
    return this.registry.activeEvent;
  }
  
  /**
   * Get event intensity (0-1)
   */
  getEventIntensity() {
    return this.registry.intensity;
  }
  
  /**
   * Force trigger a specific event (for testing)
   */
  forceEvent(eventType, legendaryCount = 2, linkingSystem = null) {
    if (this._isSuppressed()) return;
    console.log('[WorldEvents] Force event requested:', eventType, { legendaryCount, hasLinkingSystem: !!linkingSystem });
    this.startWorldEvent(eventType, legendaryCount, linkingSystem);
    // Allow callers to immediately reevaluate after forced events if desired
    this.pendingEvaluation = true;
  }

  setSuppressed(suppressed, cooldownMs = 0) {
    this.suppressed = !!suppressed;
    this.suppressedUntil = !suppressed && cooldownMs > 0
      ? Date.now() + cooldownMs
      : 0;

    if (this.suppressed) {
      this.pendingEvaluation = false;
    }
  }

  _isSuppressed() {
    return this.suppressed || Date.now() < this.suppressedUntil;
  }
  
  /**
   * Disable all world events (safe shutdown)
   */
  disableAll() {
    this.cleanupAllVFX();
    this.registry = {
      activeEvent: null,
      timer: 0,
      intensity: 0,
      duration: 0,
      phase: 'idle',
      seed: 0
    };
    this.lastEventTime = 0;
    this.interpretationAccumulator = this.config.eventInterpretationInterval;
    this.pendingEvaluation = true;
  }

  /**
   * Reset internal state for world switch
   * Clears mutable state without removing objects from scene
   * Safe to call multiple times
   */
  resetForWorldSwitch() {
    // Clear registry state
    if (this.registry) {
      this.registry.activeEvent = null;
      this.registry.timer = 0;
      this.registry.intensity = 0;
      this.registry.duration = 0;
      this.registry.phase = 'idle';
      this.registry.seed = 0;
    }

    // Clear tracking timestamps
    this.lastEventCheck = 0;
    this.lastEventTime = 0;
    this.interpretationAccumulator = this.config.eventInterpretationInterval;
    this.pendingEvaluation = true;

    // Clear VFX containers (but do NOT remove from scene)
    if (this.vfxContainer) {
      if (Array.isArray(this.vfxContainer.shockwaves)) {
        this.vfxContainer.shockwaves.length = 0;
      }
      if (Array.isArray(this.vfxContainer.particles)) {
        this.vfxContainer.particles.length = 0;
      }
      if (Array.isArray(this.vfxContainer.meshes)) {
        this.vfxContainer.meshes.length = 0;
      }
      if (Array.isArray(this.vfxContainer.trails)) {
        this.vfxContainer.trails.length = 0;
      }
      if (Array.isArray(this.vfxContainer.beams)) {
        this.vfxContainer.beams.length = 0;
      }
      if (Array.isArray(this.vfxContainer.overlays)) {
        this.vfxContainer.overlays.length = 0;
      }
      if (Array.isArray(this.vfxContainer.distortionQuads)) {
        this.vfxContainer.distortionQuads.length = 0;
      }
    }
  }

  _resolveMetricBus() {
    if (globalThis?.ATOMA_BUS || globalThis?.semanticBus) {
      return globalThis.ATOMA_BUS || globalThis.semanticBus || null;
    }

    const browserWindow = typeof window !== 'undefined' ? window : null;
    return browserWindow?.ATOMA_BUS || browserWindow?.semanticBus || null;
  }

  _setupMetricTriggers() {
    this._subscribeMetricTag('global.synergy.high', () => this._triggerMetricMappedEvent('COSMIC_PULSE'));
    this._subscribeMetricTag('global.harmony.high', () => this._triggerMetricMappedEvent('AURORA_STATE'));
    this._subscribeMetricTag('global.corruption.high', () => this._triggerMetricMappedEvent('SIGMA_INVASION'));
    this._subscribeMetricTag('global.stability.high', () => this._triggerMetricMappedEvent('QUANTUM_ECLIPSE'));
    this._subscribeMetricTag('global.loadPressure.high', () => this._triggerMetricMappedEvent('FRACTAL_STORM'));
    this._subscribeMetricTag('global.synergy.mid', () => {
      this.pendingEvaluation = true;
    });
    this._subscribeMetricTag('global.harmony.mid', () => {
      this.pendingEvaluation = true;
    });
  }

  _subscribeMetricTag(eventName, handler) {
    const bus = this.metricBus;
    if (!bus || !eventName || typeof handler !== 'function') return;

    if (typeof bus.on === 'function') {
      bus.on(eventName, handler);
      return;
    }

    if (typeof bus.subscribe === 'function') {
      bus.subscribe(eventName, handler);
    }
  }

  _triggerMetricMappedEvent(eventType) {
    if (this.registry.activeEvent || !eventType) return;
    this.forceEvent(eventType);
  }
}


