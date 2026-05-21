/**
 * CascadeParticleSystem_Session120.js
 * ============================================================================
 * SEMANTIC PARTICLE ENCODING FOR CONFLICT CASCADES
 * 
 * Implements "Semantic Particle Encoding" where particle shape and motion
 * carry specific meaning about conflict type and flow direction.
 * 
 * FEATURES:
 * 1. Shape Encoding (What is happening?):
 *    - Phase Conflict -> Arcs/Crescents (Out of sync)
 *    - Polarity Conflict -> Forked/Split (Opposing intent)
 *    - Corruption Conflict -> Fractured Shards (Structural damage)
 *    - stability Conflict -> Irregular Blobs (Unreliable)
 * 
 * 2. Velocity Encoding (Where is influence going?):
 *    - Forward Flow -> Dominant propagation
 *    - Backflow -> Resistance/Absorption
 *    - Oscillatory -> Stalemate/Negotiation
 * 
 * ARCHITECTURE:
 * - Single GPU draw call (THREE.Points)
 * - Texture Atlas for shape switching
 * - CPU-driven motion (for complex path following)
 * - Shader-driven shape selection via attributes
 * - Zero per-frame allocations
 * 
 * @author VFX Technical Director — ATOMA Project Session 120
 * @version 1.0.0
 */

import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { resolveLinkCategoryColor } from './LinkCategoryColorContract.js';
import { createLogger, isDebugEnabled } from './src/utils/DebugLogger.js';
import { LinkPointFXBase } from './LinkPointFXBase.js';
import { eventRegistrationRegistry } from './Engine/EventRegistrationRegistry.js';

export class CascadeParticleSystem_Session120 {
  constructor(scene, config = {}) {
    this.scene = scene;
    
    this.config = {
      maxParticles: config.maxParticles ?? 1500,
      baseSize: config.baseSize ?? 4.8,
      visualSizeBoost: config.visualSizeBoost ?? 1.6,
      emissionRate: config.emissionRate ?? 4.8,
      enabled: config.enabled ?? true,
      debugMode: config.debugMode ?? false,
      perLinkCap: config.perLinkCap ?? 20,
      baseCascadeParticles: config.baseCascadeParticles ?? 60,
      hopDecay: config.hopDecay ?? 0.82,
      cascadeHopCooldown: config.cascadeHopCooldown ?? 0.3, // Cooldown in seconds
      minimumVisibleIntensity: config.minimumVisibleIntensity ?? 0.05, // Lowered threshold
      distanceSize: {
        perspectiveBase: config.distanceSize?.perspectiveBase ?? 10.0,
        falloffRate: config.distanceSize?.falloffRate ?? 0.0,
        falloffExponent: config.distanceSize?.falloffExponent ?? 1.0,
        minPointSize: config.distanceSize?.minPointSize ?? 1.0,
        maxPointSize: config.distanceSize?.maxPointSize ?? 20.0
      },
      lod: {
        enabled: config.lod?.enabled ?? true,
        nearDistance: config.lod?.nearDistance ?? 14.0,
        farDistance: config.lod?.farDistance ?? 42.0,
        minDensity: config.lod?.minDensity ?? 0.42,
        minOpacity: config.lod?.minOpacity ?? 0.55
      },
      trailEnabled: config.trailEnabled ?? true,
      trailEmissionRate: config.trailEmissionRate ?? 0.6,
      trailLengthFactor: config.trailLengthFactor ?? 0.15,
      maxTrailLength: config.maxTrailLength ?? 8.0,
      minTrailLength: config.minTrailLength ?? 0.5,
      trailBaseOpacity: config.trailBaseOpacity ?? 0.6,
      trailFadeRate: config.trailFadeRate ?? 12.0,
      trailLifetime: config.trailLifetime ?? 0.18,
      trailHistoryFrames: config.trailHistoryFrames ?? 2,
      maxTrailParticles: config.maxTrailParticles ?? 1000,
      cascadeEmissionBoostEnabled: config.cascadeEmissionBoostEnabled ?? true,
      cascadeColorTintingEnabled: config.cascadeColorTintingEnabled ?? true,
      particleSemanticDensityEnabled: config.particleSemanticDensityEnabled ?? true,
      maxEmissionMultiplier: config.maxEmissionMultiplier ?? 3.0,
      cascadeToEmissionResponse: config.cascadeToEmissionResponse ?? 'quadratic',
      burstPulseFrequencyBase: config.burstPulseFrequencyBase ?? 2.0,
      burstPulseFrequencyMax: config.burstPulseFrequencyMax ?? 10.0,
      burstModulationDepth: config.burstModulationDepth ?? 0.2,
      emissionEMAAlpha: config.emissionEMAAlpha ?? 0.2,
      colorEMAAlpha: config.colorEMAAlpha ?? 0.15,
      brightnessModulationDepth: config.brightnessModulationDepth ?? 0.2,
      enableConflictTypeDetection: config.enableConflictTypeDetection ?? true,
      enableCorruptionTinting: config.enableCorruptionTinting ?? true,
      intensityEMAAlpha: config.intensityEMAAlpha ?? 0.2,
      urgencyEMAAlpha: config.urgencyEMAAlpha ?? 0.15,
      maxDensityMultiplier: config.maxDensityMultiplier ?? 4.0,
      densitySafetyThreshold: config.densitySafetyThreshold ?? 3.5,
      maxClusterCohesion: config.maxClusterCohesion ?? 1.0,
      minClusterRadius: config.minClusterRadius ?? 0.1,
      maxClusterRadius: config.maxClusterRadius ?? 2.0,
    };
    
    // Debug logger
    this._logger = createLogger('CascadeParticleSystem');
    
    // Texture Atlas Dimensions
    this.atlasSize = 128; // 128x128 texture
    this.gridSize = 2;    // 2x2 grid (4 shapes)
    
    // Particle Pool
    this.pool = [];
    this.activeCount = 0;
    this._freeParticleIndices = [];
    this._activeParticleIndices = [];
    this._resolvedLinksScratch = [];
    
    this._cascadeTimeOrigin = undefined;
    this._lastCascadeTime = undefined;
    this._activeLinks = [];
    this._activeLinkIdSet = new Set();
    this._pendingLinkEvents = [];
    this._linkLifecycleSource = null;
    this._linkLifecycleUnsubscribers = [];
    this._linkSpawnState = new Map();
    this._tmpSourceWorldPos = new THREE.Vector3();
    this._tmpTargetWorldPos = new THREE.Vector3();
    this._tmpMidpoint = new THREE.Vector3();
    this._tmpParticleColor = new THREE.Color();
    this._tmpSourceCategoryColor = new THREE.Color();
    this._tmpTargetCategoryColor = new THREE.Color();
    this._neutralParticleColor = new THREE.Color(1.0, 0.3, 0.1) // Bright orange-red for visibility
    this._cascadeColorPalette = {
      destructiveConflict: {
        low: new THREE.Color(0xFF6699),
        medium: new THREE.Color(0xFF3366),
        high: new THREE.Color(0xFF0033),
      },
      specializationDrift: {
        low: new THREE.Color(0x66FFFF),
        medium: new THREE.Color(0x33CCFF),
        high: new THREE.Color(0x0099FF),
      },
      fatigueYield: {
        low: new THREE.Color(0xFFFF99),
        medium: new THREE.Color(0xFFDD00),
        high: new THREE.Color(0xFFAA00),
      },
      oscillatoryBalance: {
        low: new THREE.Color(0x66FF99),
        medium: new THREE.Color(0x00FF99),
        high: new THREE.Color(0x00DD77),
      },
      resolvedHarmony: {
        low: new THREE.Color(0x99FFFF),
        medium: new THREE.Color(0x66FFFF),
        high: new THREE.Color(0x00FFFF),
      },
      corruptionCascade: {
        low: new THREE.Color(0xFF9999),
        medium: new THREE.Color(0xFF3333),
        high: new THREE.Color(0xCC1111),
      },
      neutral: {
        low: new THREE.Color(0xCCCCCC),
        medium: new THREE.Color(0xFFFFFF),
        high: new THREE.Color(0xFFFFFF),
      },
    };
    this._currentCamera = null;
    
    // Cascade hop cooldown tracking (per link)
    this._linkHopCooldowns = new Map(); // linkId -> lastHopTime
    this._debugHelpers = null;
    this._debugMarkerPool = [];
    this._debugMarkerCount = config.debugMarkerCount ?? 24;
    this._debugSourceMarkers = [];
    this._debugTargetMarkers = [];
    this._debugParticleMarkers = [];
    this.semanticBus = config.semanticBus ?? globalThis?.semanticBus ?? null;
    this._topologyBiasAccentCooldowns = new Map();
    this._topologyBiasAccentUnsubscribers = [];
    this._topologyBiasAccentBound = null;
    this._semanticUnsubscribers = [];
    this._semanticRefreshRequested = false;
    this._cascadeHopState = new Map();
    this._semanticLinkState = new Map();
    this._cascadeEmissionBoostState = this._semanticLinkState;
    this._cascadeColorTintState = this._semanticLinkState;
    this._particleSemanticDensityState = this._semanticLinkState;
    this._semanticStats = {
      activeBoosts: 0,
      activeColorTints: 0,
      activeLinkCount: 0,
      avgIntensity: 0,
      avgUrgency: 0,
      conflictTypeDistribution: {},
      totalEmissionMultiplier: 0,
      peakEmissionMultiplier: 1,
    };
    this._semanticTime = 0;
    this.trailPool = [];
    this.activeTrailCount = 0;
    this._trailPositionHistory = new Map();
    this._trailScratchPosition = new THREE.Vector3();
    this._trailScratchDirection = new THREE.Vector3();
    this._trailScratchDelta = new THREE.Vector3();
    this.trailGeometry = null;
    this.trailMaterial = null;
    this.trailMesh = null;
    this.trailStats = {
      trailsSpawned: 0,
      activeTrails: 0,
      totalTrailLength: 0,
    };

    // Resources
    this.geometry = null;
    this.material = null;
    this.mesh = null;
    this.textureAtlas = null;
    this.pointFXBase = new LinkPointFXBase(this.scene, {
      renderLayer: 'LINK_CASCADE',
      preset: 'cascade',
      capacity: this.config.maxParticles,
      textureKind: 'cascade'
    });
    
    // Init
    this.init();
    this._setupSemanticSubscriptions();
  }

  attachLinkLifecycleSource(linkingSystem) {
    if (!linkingSystem || this._linkLifecycleSource === linkingSystem) return;

    this._linkLifecycleSource = linkingSystem;

    const createdHandler = (source, target, link) => this.handleLinkCreated(link || source || target || null);
    const updatedHandler = (link) => this.handleLinkUpdated(link);
    const destroyedHandler = (link) => this.handleLinkDestroyed(link);

    if (typeof linkingSystem.onLinkCreated === 'function') {
      linkingSystem.onLinkCreated(createdHandler);
    }
    if (typeof linkingSystem.onLinkUpdated === 'function') {
      linkingSystem.onLinkUpdated(updatedHandler);
    }
    if (typeof linkingSystem.onLinkDestroyed === 'function') {
      linkingSystem.onLinkDestroyed(destroyedHandler);
    } else if (typeof linkingSystem.onLinkRemoved === 'function') {
      linkingSystem.onLinkRemoved((source, target, link) => destroyedHandler(link || source || target || null));
    }
  }

  handleLinkCreated(link) {
    if (!link?.id) return;
    this._pendingLinkEvents.push({ type: 'created', link });
  }

  handleLinkUpdated(link) {
    if (!link?.id) return;
    this._pendingLinkEvents.push({ type: 'updated', link });
  }

  handleLinkDestroyed(link) {
    const linkId = link?.id || link?.uuid || link?.name;
    if (!linkId) return;
    this._pendingLinkEvents.push({ type: 'destroyed', link, linkId });
  }
  
  /**
   * Initialize resources
   */
  init() {
    // 1. Generate Texture Atlas
    this.textureAtlas = this._generateTextureAtlas();
    
    // 2. Initialize Geometry
    this.geometry = this.pointFXBase.createGeometry({
      opacity: { itemSize: 1 },
      size: { itemSize: 1 },
      shapeIndex: { itemSize: 1 },
      angle: { itemSize: 1 }
    });

    const positions = new Float32Array(this.config.maxParticles * 3);
    const colors = new Float32Array(this.config.maxParticles * 3);
    const opacities = new Float32Array(this.config.maxParticles);
    const sizes = new Float32Array(this.config.maxParticles);
    const shapeIndices = new Float32Array(this.config.maxParticles); // 0-3 for atlas index
    const angles = new Float32Array(this.config.maxParticles); // Rotation
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('shapeIndex', new THREE.BufferAttribute(shapeIndices, 1).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1).setUsage(THREE.DynamicDrawUsage));
    
    // 3. Initialize Shader Material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uAtlas: { value: this.textureAtlas },
        uGridSize: { value: this.gridSize },
        uDistanceSizeBase: { value: this.config.distanceSize.perspectiveBase },
        uDistanceFalloffRate: { value: this.config.distanceSize.falloffRate },
        uDistanceFalloffExponent: { value: this.config.distanceSize.falloffExponent },
        uMinPointSize: { value: this.config.distanceSize.minPointSize },
        uMaxPointSize: { value: this.config.distanceSize.maxPointSize }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float opacity;
        attribute float shapeIndex;
        attribute float angle;
        uniform float uDistanceSizeBase;
        uniform float uDistanceFalloffRate;
        uniform float uDistanceFalloffExponent;
        uniform float uMinPointSize;
        uniform float uMaxPointSize;
        
        varying vec3 vColor;
        varying float vOpacity;
        varying float vShapeIndex;
        varying float vAngle;
        
        void main() {
          vColor = color;
          vOpacity = opacity;
          vShapeIndex = shapeIndex;
          vAngle = angle;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // Spark/Healing-style distance attenuation: reliable screen-space shrink with depth.
          float perspectiveFactor = uDistanceSizeBase / max(1.0, -mvPosition.z);
          gl_PointSize = clamp(size * perspectiveFactor, uMinPointSize, uMaxPointSize);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uAtlas;
        uniform float uGridSize;
        
        varying vec3 vColor;
        varying float vOpacity;
        varying float vShapeIndex;
        varying float vAngle;
        
        void main() {
          // Rotate UVs based on angle
          float c = cos(vAngle);
          float s = sin(vAngle);
          vec2 rotUV = vec2(
            c * (gl_PointCoord.x - 0.5) - s * (gl_PointCoord.y - 0.5) + 0.5,
            s * (gl_PointCoord.x - 0.5) + c * (gl_PointCoord.y - 0.5) + 0.5
          );
          
          // Map to atlas grid
          float col = mod(vShapeIndex, uGridSize);
          float row = floor(vShapeIndex / uGridSize);
          
          // Invert row because UV y=0 is bottom
          row = (uGridSize - 1.0) - row;
          
          vec2 atlasUV = (rotUV + vec2(col, row)) / uGridSize;
          
          // Sample the texture atlas for shape
          float shapeAlpha = texture2D(uAtlas, atlasUV).r;
          
          // Radial glow fallback for visibility
          float radial = 1.0 - smoothstep(0.0, 0.5, length(gl_PointCoord - 0.5));
          float glowMask = smoothstep(0.02, 1.0, radial);
          
          // Combine shape from atlas with radial glow
          float combinedAlpha = max(shapeAlpha, glowMask * 0.6);
          
          // Use vertex color (vColor) instead of hardcoded red
          // Boost saturation for cascade conflict visibility
          vec3 baseColor = vColor.rgb;
          vec3 finalColor = baseColor * 1.15 + vec3(0.08, 0.02, 0.02); // Warm tint for cascade feel
          
          gl_FragColor = vec4(finalColor, combinedAlpha * 0.78 * vOpacity);
          
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      blending: THREE.NormalBlending,
    });
    
    // 4. Create Mesh
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.frustumCulled = false; // Always render if active
    this.mesh.visible = true;
    this.mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_CASCADE);
    this.pointFXBase.ensureAttached(this.mesh);
    
    this._logger.logIf(this.config.debugMode, 'Initialized and added to scene:', {
      maxParticles: this.config.maxParticles,
      meshVisible: this.mesh.visible,
      geometryAttrs: Object.keys(this.geometry.attributes)
    });
    
    // 5. Initialize Pool
    this._initPool();
    this._initTrailLayer();
    this._initDebugHelpers();
    this._bindTopologyBiasAccentSubscriptions();
  }
  
  /**
   * Generate Texture Atlas with 4 distinct shapes
   * 0: Arcs (Phase)
   * 1: Forks (Polarity)
   * 2: Shards (Corruption)
   * 3: Blobs (stability)
   */
  _generateTextureAtlas() {
    const canvas = document.createElement('canvas');
    canvas.width = this.atlasSize;
    canvas.height = this.atlasSize;
    const ctx = canvas.getContext('2d');
    const cell = this.atlasSize / this.gridSize; // 64px
    const half = cell / 2;
    
    ctx.fillStyle = '#00000000';
    ctx.clearRect(0, 0, this.atlasSize, this.atlasSize);
    
    // Helper to draw in cell
    const drawInCell = (col, row, fn) => {
      ctx.save();
      ctx.translate(col * cell + half, row * cell + half);
      fn(ctx, half * 0.8); // radius
      ctx.restore();
    };
    
    // Shape 0: Arcs / Crescents (Phase Conflict)
    // "Out of sync, but compatible"
    drawInCell(0, 0, (c, r) => {
      c.strokeStyle = 'white';
      c.lineWidth = 3;
      c.shadowBlur = 4;
      c.shadowColor = 'white';
      
      c.beginPath();
      c.arc(0, 0, r, Math.PI * 0.2, Math.PI * 0.8);
      c.stroke();
      
      c.beginPath();
      c.arc(0, 0, r * 0.6, Math.PI * 1.2, Math.PI * 1.8);
      c.stroke();
    });
    
    // Shape 1: Forked / Split (Polarity Conflict)
    // "Opposing intent"
    drawInCell(1, 0, (c, r) => {
      c.fillStyle = 'white';
      c.shadowBlur = 4;
      c.shadowColor = 'white';
      
      c.beginPath();
      // Y-shape
      c.moveTo(0, r);
      c.lineTo(-r * 0.6, -r);
      c.lineTo(-r * 0.2, -r);
      c.lineTo(0, -r * 0.2);
      c.lineTo(r * 0.2, -r);
      c.lineTo(r * 0.6, -r);
      c.closePath();
      c.fill();
    });
    
    // Shape 2: Fractured Shards (Corruption Conflict)
    // "Structural damage"
    drawInCell(0, 1, (c, r) => {
      c.fillStyle = 'white';
      c.shadowBlur = 2;
      c.shadowColor = 'white';
      
      // Main shard
      c.beginPath();
      c.moveTo(-r * 0.5, r * 0.5);
      c.lineTo(r * 0.6, -r * 0.4);
      c.lineTo(r * 0.2, -r * 0.8);
      c.lineTo(-r * 0.2, -r * 0.2);
      c.closePath();
      c.fill();
      
      // Small shard
      c.beginPath();
      c.moveTo(-r * 0.8, -r * 0.2);
      c.lineTo(-r * 0.4, 0);
      c.lineTo(-r * 0.6, r * 0.3);
      c.closePath();
      c.fill();
    });
    
    // Shape 3: Irregular Blobs (stability Conflict)
    // "Unreliable environment"
    drawInCell(1, 1, (c, r) => {
      c.fillStyle = 'white';
      c.shadowBlur = 6;
      c.shadowColor = 'white';
      
      c.beginPath();
      c.moveTo(r, 0);
      for(let i=0; i<8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const rad = r * (0.6 + Math.random() * 0.4);
        c.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
      }
      c.closePath();
      c.fill();
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }
  
  /**
   * Initialize Object Pool
   */
  _initPool() {
    this.pool.length = 0;
    this._freeParticleIndices.length = 0;
    this._activeParticleIndices.length = 0;

    for (let i = 0; i < this.config.maxParticles; i++) {
      this.pool.push({
        active: false,
        index: i,
        activeListIndex: -1,
        lifetime: 0,
        maxLifetime: 1.0,
        // Physics
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        // Link reference for path following
        linkRef: null,
        sourceColor: new THREE.Color(1, 1, 1),
        targetColor: new THREE.Color(1, 1, 1),
        sourcePosition: new THREE.Vector3(),
        targetPosition: new THREE.Vector3(),
        pathProgress: 0, // 0-1 along link
        pathDirection: 1, // 1 or -1
        pathOffset: new THREE.Vector3(), // Lateral offset
        opacityScale: 1.0,
        // Semantic Data
        conflictType: 'none',
        flowType: 'forward', // forward, backflow, oscillatory
        shapeIndex: 0,
        spawnTime: 0,
      });
    }

    for (let i = this.config.maxParticles - 1; i >= 0; i--) {
      this._freeParticleIndices.push(i);
    }
  }

  /**
   * Initialize trail rendering resources
   */
  _initTrailLayer() {
    if (this.trailMesh || this.config.trailEnabled === false) {
      return;
    }

    this.trailGeometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.config.maxTrailParticles * 3);
    const colors = new Float32Array(this.config.maxTrailParticles * 3);
    const sizes = new Float32Array(this.config.maxTrailParticles);
    const ages = new Float32Array(this.config.maxTrailParticles);
    const lengths = new Float32Array(this.config.maxTrailParticles);

    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
    this.trailGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));
    this.trailGeometry.setAttribute('age', new THREE.BufferAttribute(ages, 1).setUsage(THREE.DynamicDrawUsage));
    this.trailGeometry.setAttribute('length', new THREE.BufferAttribute(lengths, 1).setUsage(THREE.DynamicDrawUsage));

    this.trailMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTrailFadeRate: { value: this.config.trailFadeRate },
        uBaseOpacity: { value: this.config.trailBaseOpacity },
        uTrailLifetime: { value: this.config.trailLifetime },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float age;
        attribute float length;

        varying vec3 vColor;
        varying float vOpacity;
        varying float vTrailStretch;

        uniform float uTrailFadeRate;
        uniform float uBaseOpacity;
        uniform float uTrailLifetime;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float distanceScale = 180.0 / max(1.0, -mvPosition.z);
          gl_PointSize = clamp(size * (1.0 + length * 0.3) * distanceScale, 1.5, 72.0);

          float ageFraction = age / uTrailLifetime;
          float fadeAlpha = exp(-ageFraction * uTrailFadeRate);
          vOpacity = fadeAlpha * uBaseOpacity;
          vTrailStretch = length;
          vColor = color;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        varying float vTrailStretch;

        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float dist = length(c);
          float softness = 1.0 - smoothstep(0.0, 0.5, dist);
          float glow = exp(-dist * dist * 3.0) * vTrailStretch;
          gl_FragColor = vec4(vColor, (softness + glow * 0.5) * vOpacity);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      transparent: true,
      toneMapped: false,
    });

    this.trailMesh = new THREE.Points(this.trailGeometry, this.trailMaterial);
    this.trailMesh.name = 'ParticleTrails_Session122';
    this.trailMesh.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_PARTICLES);
    this.trailMesh.frustumCulled = false;
    this.trailMesh.visible = true;
    this.scene?.add(this.trailMesh);

    this.trailPool.length = 0;
    for (let i = 0; i < this.config.maxTrailParticles; i++) {
      this.trailPool.push({
        position: new THREE.Vector3(),
        prevPosition: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        age: 0,
        lifetime: 0,
        length: 0,
        size: 1,
        active: false,
        particleIndex: -1,
        spawnTime: 0,
      });
    }

    this.trailGeometry.setDrawRange(0, 0);
  }

  setSemanticBus(semanticBus) {
    if (semanticBus === this.semanticBus) return;
    this.semanticBus = semanticBus ?? null;
    this._setupSemanticSubscriptions();
  }

  _setupSemanticSubscriptions() {
    if (Array.isArray(this._semanticUnsubscribers)) {
      for (const unsub of this._semanticUnsubscribers) {
        try {
          unsub?.();
        } catch (_) {
          // noop
        }
      }
      this._semanticUnsubscribers.length = 0;
    }

    const bus = this.semanticBus ?? globalThis?.semanticBus ?? null;
    if (!bus) return;

    this.semanticBus = bus;

    const requestRefresh = () => {
      this._semanticRefreshRequested = true;
    };

    const onCascadeHop = (event = {}) => {
      if (!this._isAuthoritativeCascadeEvent(event)) return;
      const linkId = event.linkId ?? event.link?.uuid ?? event.link?.id ?? event.link?.name;
      if (!linkId) return;

      const intensity = Math.max(0, Math.min(1, Number(event.intensity ?? event.energy ?? 0) || 0));
      const hop = Math.max(0, Number(event.hopIndex ?? event.hop ?? 0) || 0);
      const hopDecay = Math.pow(0.85, hop);
      this._cascadeHopState.set(String(linkId), {
        intensity: intensity * hopDecay,
      });
      requestRefresh();
    };

    const bind = (eventName, handler) => {
      const disposer = eventRegistrationRegistry.register(
        'CascadeParticleSystem', eventName, handler, bus
      );
      this._semanticUnsubscribers.push(disposer);
    };

    bind('cascade.hop', onCascadeHop);

    // Canonical tiered events → cascade particle response
    const onLinkSynergyTier = (payload = {}) => {
      const link = payload?.link || (payload?.linkId ? this._resolveLinkById(payload.linkId) : null);
      if (!link) return;
      const key = this._getLinkSemanticKey(link);
      if (!key) return;
      const tier = payload?.tier || 'mid';
      const tierBoost = { low: 0.3, mid: 0.6, high: 1.0 }[tier] || 0.5;
      const state = this._getOrCreateSemanticState(link);
      if (!state) return;
      const boost = state.cascadeIntensity * 0.5 + tierBoost * 0.5;
      link.userData.cascadeParticleEmissionBoost = Math.max(
        link.userData.cascadeParticleEmissionBoost ?? 1,
        1 + boost * (this.config.maxEmissionMultiplier - 1)
      );
      requestRefresh();
    };

    const onNodeCorruptionTier = (payload = {}) => {
      const nodeId = payload?.nodeId || payload?.id;
      const node = nodeId ? this._resolveNodeById(nodeId) : null;
      if (!node) return;
      const tier = payload?.tier || 'mid';
      const intensity = { low: 0.35, mid: 0.65, high: 0.95 }[tier] || 0.5;
      const allLinks = this._resolvedLinksScratch || [];
      if (!allLinks.length) return;
      for (const lnk of allLinks) {
        if (!lnk) continue;
        const src = lnk.source ?? lnk.sourceNode ?? lnk.from;
        const tgt = lnk.target ?? lnk.targetNode ?? lnk.to;
        if (src === node || tgt === node) {
          lnk.userData.cascadeIntensity = Math.max(
            lnk.userData.cascadeIntensity ?? 0,
            intensity
          );
          lnk.userData.cascadeConflictType = lnk.userData.cascadeConflictType || 'corruption';
          requestRefresh();
        }
      }
    };

    bind('link.synergy.high', onLinkSynergyTier);
    bind('link.synergy.mid', onLinkSynergyTier);
    bind('link.synergy.low', onLinkSynergyTier);
    bind('node.corruption.high', onNodeCorruptionTier);
    bind('node.corruption.mid', onNodeCorruptionTier);
    bind('node.corruption.low', onNodeCorruptionTier);
  }

  _resolveNodeById(nodeId) {
    const key = String(nodeId ?? '').trim();
    if (!key) return null;
    for (const lnk of this._activeLinks) {
      if (!lnk) continue;
      const src = lnk.source ?? lnk.sourceNode ?? lnk.from;
      const tgt = lnk.target ?? lnk.targetNode ?? lnk.to;
      const sid = src?.userData?.nodeId ?? src?.userData?.id ?? src?.uuid ?? '';
      const tid = tgt?.userData?.nodeId ?? tgt?.userData?.id ?? tgt?.uuid ?? '';
      if (String(sid) === key) return src;
      if (String(tid) === key) return tgt;
    }
    return null;
  }

  _resolveLinkById(linkId) {
    const key = String(linkId ?? '').trim();
    if (!key) return null;
    for (const lnk of this._activeLinks) {
      if (!lnk) continue;
      const lid = lnk.uuid ?? lnk.id ?? lnk.name ?? '';
      if (String(lid) === key) return lnk;
    }
    return null;
  }

  _isAuthoritativeCascadeEvent(event = {}) {
    const authorityOwner = event?.authorityOwner ?? event?.link?.userData?.cascadeAuthorityOwner ?? null;
    return authorityOwner === 'CascadeEventBridge_v1';
  }

  _getLinkSemanticKey(link) {
    return String(link?.uuid ?? link?.id ?? link?.name ?? '');
  }

  _getOrCreateSemanticState(link) {
    const key = this._getLinkSemanticKey(link);
    if (!key) return null;

    let state = this._semanticLinkState.get(key);
    if (!state) {
      state = {
        key,
        cascadeIntensity: 0,
        emissionBoost: 1,
        burstPhase: 0,
        emissionBoostSmoothed: 1,
        color: new THREE.Color(1, 1, 1),
        colorRGB: { r: 1, g: 1, b: 1 },
        colorHex: 'ffffff',
        intensitySmoothed: 0,
        urgencySmoothed: 0,
        densityMultiplier: 1,
        clusterCohesion: 0,
        clusterRadius: this.config.maxClusterRadius,
        urgencyOscillation: 0,
        conflictType: 'none',
        conflictIntensity: 0,
        lastUpdateTime: 0,
      };
      this._semanticLinkState.set(key, state);
    }

    return state;
  }

  _smoothValue(prev, curr, alpha, deltaTime) {
    const safeAlpha = Math.max(0, Math.min(1, Number(alpha) || 0));
    const safeDt = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0;
    const dtAlpha = 1 - Math.pow(1 - safeAlpha, safeDt * 60);
    return prev * (1 - dtAlpha) + curr * dtAlpha;
  }

  _applyCascadeResponseCurve(cascadeIntensity) {
    const intensity = Math.max(0, Math.min(1, Number(cascadeIntensity) || 0));
    const curve = this.config.cascadeToEmissionResponse;

    if (curve === 'linear') {
      return intensity;
    }
    if (curve === 'quadratic') {
      return intensity * intensity;
    }
    if (curve === 'exponential') {
      return Math.pow(2.0, intensity) - 1.0;
    }

    return intensity * intensity;
  }

  _mapConflictStateToType(state) {
    switch (String(state ?? '').trim().toLowerCase()) {
      case 'active':
      case 'phase_negotiation':
      case 'destructive':
        return 'destructive';
      case 'specialization_drift':
        return 'specialization_drift';
      case 'fatigue_yield':
        return 'fatigue_yield';
      case 'oscillatory_balance':
        return 'oscillatory_balance';
      case 'resolved_dominant':
      case 'resolved_equilibrium':
      case 'harmony':
        return 'resolved_harmony';
      case 'corruption':
        return 'corruption';
      default:
        return 'none';
    }
  }

  _getCascadeColorKey(conflictType) {
    switch (String(conflictType ?? '').trim().toLowerCase()) {
      case 'destructive':
        return 'destructiveConflict';
      case 'specialization_drift':
        return 'specializationDrift';
      case 'fatigue_yield':
        return 'fatigueYield';
      case 'oscillatory_balance':
        return 'oscillatoryBalance';
      case 'resolved_harmony':
        return 'resolvedHarmony';
      case 'corruption':
        return 'corruptionCascade';
      default:
        return 'neutral';
    }
  }

  _resolveCascadeIntensityForLink(link, cascadeSystem = null) {
    let intensity = 0;

    if (cascadeSystem && cascadeSystem !== this && typeof cascadeSystem.getLinkCascadeInfo === 'function') {
      const cascadeInfo = cascadeSystem.getLinkCascadeInfo(link);
      if (cascadeInfo) {
        intensity = Math.max(intensity, Number(cascadeInfo.intensity ?? 0) || 0);
      }
    }

    const u = link?.userData;
    if (!u) {
      return Math.max(0, Math.min(1, intensity));
    }

    const canonicalIntensitySources = [
      u.cascadeIntensity,
      u.flowState?.intensity,
      u.metrics?.synergy,
      u.synergy?.score,
      link?.synergyScore,
    ];

    for (const value of canonicalIntensitySources) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        intensity = Math.max(intensity, numeric);
      }
    }

    return Math.max(0, Math.min(1, intensity));
  }

  _resolveConflictTypeForLink(link, conflictSystem = null) {
    const u = link?.userData;
    if (!u) return 'none';

    if (typeof u.cascadeConflictType === 'string' && u.cascadeConflictType && u.cascadeConflictType !== 'none') {
      return this._mapConflictStateToType(u.cascadeConflictType);
    }

    if (typeof u.flowState?.type === 'string' && u.flowState.type) {
      const mapped = this._mapConflictStateToType(u.flowState.type);
      if (mapped !== 'none') return mapped;
    }

    if (conflictSystem && typeof conflictSystem.getConflictState === 'function') {
      const conflictInfo = conflictSystem.getConflictState();
      const nodeA = link?.source ?? link?.sourceNode ?? link?.from ?? link?.nodes?.[0] ?? null;
      const nodeB = link?.target ?? link?.targetNode ?? link?.to ?? link?.nodes?.[1] ?? null;

      if (conflictInfo?.activeConflicts && nodeA && nodeB) {
        for (const region of conflictInfo.activeConflicts) {
          if (!region) continue;

          const hub1Id = region.hub1?.userData?.id;
          const hub2Id = region.hub2?.userData?.id;
          const aId = nodeA.userData?.id;
          const bId = nodeB.userData?.id;

          if ((hub1Id === aId && hub2Id === bId) || (hub1Id === bId && hub2Id === aId)) {
            return this._mapConflictStateToType(region.state || 'none');
          }

          const sourcePos = this._isValidWorldPosition(nodeA.position) ? nodeA.position : null;
          const targetPos = this._isValidWorldPosition(nodeB.position) ? nodeB.position : null;
          if (sourcePos && targetPos && this._tmpMidpoint) {
            this._tmpMidpoint.copy(sourcePos).add(targetPos).multiplyScalar(0.5);
            const regionCenter = region.centerPos;
            if (regionCenter && this._isValidWorldPosition(regionCenter) && this._tmpMidpoint.distanceTo(regionCenter) < 10.0) {
              return this._mapConflictStateToType(region.state || 'none');
            }
          }
        }
      }
    }

    if (this.config.enableCorruptionTinting) {
      const nodeA = link?.source ?? link?.sourceNode ?? link?.from ?? link?.nodes?.[0] ?? null;
      const nodeB = link?.target ?? link?.targetNode ?? link?.to ?? link?.nodes?.[1] ?? null;
      const linkCorruption = Number(u.corruptionLevel ?? 0) || 0;
      const nodeACorruption = Number(nodeA?.userData?.metrics?.corruption ?? 0) || 0;
      const nodeBCorruption = Number(nodeB?.userData?.metrics?.corruption ?? 0) || 0;
      if (linkCorruption > 0.5 || nodeACorruption > 0.5 || nodeBCorruption > 0.5) {
        return 'corruption';
      }
    }

    return 'none';
  }

  _updateSemanticLayers(deltaTime, links, cascadeSystem = null, conflictSystem = null) {
    if (!Array.isArray(links) || links.length === 0) {
      return;
    }

    const semanticEnabled = this.config.cascadeEmissionBoostEnabled !== false
      || this.config.cascadeColorTintingEnabled !== false
      || this.config.particleSemanticDensityEnabled !== false;

    if (!semanticEnabled) return;

    this._semanticTime += Math.max(0, Number(deltaTime) || 0);

    this._semanticStats.activeBoosts = 0;
    this._semanticStats.activeColorTints = 0;
    this._semanticStats.activeLinkCount = 0;
    this._semanticStats.avgIntensity = 0;
    this._semanticStats.avgUrgency = 0;
    this._semanticStats.totalEmissionMultiplier = 0;
    this._semanticStats.peakEmissionMultiplier = 1;
    this._semanticStats.conflictTypeDistribution = {};

    const now = Date.now();
    let activeCount = 0;
    let intensitySum = 0;
    let urgencySum = 0;

    for (const link of links) {
      if (!link) continue;
      if (!link.userData) link.userData = {};

      const state = this._getOrCreateSemanticState(link);
      if (!state) continue;

      const cascadeIntensity = this._resolveCascadeIntensityForLink(link, cascadeSystem);
      const conflictType = this._resolveConflictTypeForLink(link, conflictSystem);
      const conflictIntensity = Math.max(
        0,
        Math.min(
          1,
          Number(link.userData.cascadeIntensity ?? link.userData.flowState?.intensity ?? cascadeIntensity ?? 0) || 0
        )
      );

      this._updateLinkEmissionBoost(link, state, cascadeIntensity, deltaTime);
      this._updateLinkColorTint(link, state, cascadeIntensity, conflictType, conflictIntensity, deltaTime);
      this._updateLinkSemanticDensity(link, state, conflictSystem, cascadeIntensity, deltaTime, now);

      if (cascadeIntensity > 0.01 || conflictType !== 'none') {
        this._semanticStats.activeColorTints++;
      }
      if ((link.userData.cascadeParticleEmissionBoost ?? 1) > 1.01) {
        this._semanticStats.activeBoosts++;
      }
      if (conflictType !== 'none') {
        this._semanticStats.conflictTypeDistribution[conflictType] =
          (this._semanticStats.conflictTypeDistribution[conflictType] ?? 0) + 1;
      }

      activeCount++;
      intensitySum += state.intensitySmoothed ?? cascadeIntensity;
      urgencySum += state.urgencySmoothed ?? 0;
    }

    this._semanticStats.activeLinkCount = activeCount;
    if (activeCount > 0) {
      this._semanticStats.avgIntensity = intensitySum / activeCount;
      this._semanticStats.avgUrgency = urgencySum / activeCount;
      this._semanticStats.totalEmissionMultiplier = this._semanticStats.totalEmissionMultiplier / activeCount;
    }

    if (this._semanticRefreshRequested || Math.random() < 0.01) {
      this._cleanupInactiveSemanticStates();
      this._semanticRefreshRequested = false;
    }
  }

  _updateLinkEmissionBoost(link, state, cascadeIntensity, deltaTime) {
    const u = link.userData;
    if (this.config.cascadeEmissionBoostEnabled === false) {
      u.cascadeParticleEmissionBoost = 1.0;
      return;
    }

    const response = this._applyCascadeResponseCurve(cascadeIntensity);
    const targetMultiplier = 1.0 + response * (Math.max(1.0, Number(this.config.maxEmissionMultiplier) || 3.0) - 1.0);
    state.emissionBoostSmoothed = this._smoothValue(
      Number(state.emissionBoostSmoothed ?? 1.0) || 1.0,
      targetMultiplier,
      this.config.emissionEMAAlpha,
      deltaTime
    );

    const pulseFrequencyBase = Math.max(0, Number(this.config.burstPulseFrequencyBase) || 0);
    const pulseFrequencyMax = Math.max(pulseFrequencyBase, Number(this.config.burstPulseFrequencyMax) || pulseFrequencyBase);
    const pulseFrequency = pulseFrequencyBase + cascadeIntensity * (pulseFrequencyMax - pulseFrequencyBase);
    state.burstPhase += pulseFrequency * 2 * Math.PI * Math.max(0, Number(deltaTime) || 0);

    const pulse = 1.0 + Math.sin(state.burstPhase) * Math.max(0, Math.min(0.45, Number(this.config.burstModulationDepth) || 0));
    const emissionMultiplier = Math.max(1.0, Math.min(5.0, state.emissionBoostSmoothed * pulse));

    state.cascadeIntensity = cascadeIntensity;
    u.cascadeParticleEmissionBoost = emissionMultiplier;
    this._semanticStats.totalEmissionMultiplier += emissionMultiplier;
    this._semanticStats.peakEmissionMultiplier = Math.max(this._semanticStats.peakEmissionMultiplier, emissionMultiplier);
  }

  _updateLinkColorTint(link, state, cascadeIntensity, conflictType, conflictIntensity, deltaTime) {
    const u = link.userData;
    if (this.config.cascadeColorTintingEnabled === false) {
      state.color.copy(this._neutralParticleColor);
      state.colorRGB.r = state.color.r;
      state.colorRGB.g = state.color.g;
      state.colorRGB.b = state.color.b;
      state.colorHex = state.color.getHexString();
      u.cascadeParticleColor = state.color;
      u.cascadeParticleColorRGB = state.colorRGB;
      u.cascadeParticleColorHex = state.colorHex;
      u.cascadeConflictType = 'none';
      return;
    }

    const hopState = this._cascadeHopState.get(state.key);
    let hopIntensity = hopState?.intensity ?? 0;
    if (hopState) {
      hopState.intensity = Math.max(0, hopState.intensity - Math.max(0, Number(deltaTime) || 0) * 0.7);
      if (hopState.intensity <= 0.001) {
        this._cascadeHopState.delete(state.key);
      }
    }

    const tintIntensity = Math.max(cascadeIntensity, hopIntensity);
    const paletteKey = this._getCascadeColorKey(conflictType);
    const palette = this._cascadeColorPalette[paletteKey] || this._cascadeColorPalette.neutral;
    let baseColor = palette.medium;
    if (tintIntensity < 0.33) {
      baseColor = palette.low;
    } else if (tintIntensity >= 0.67) {
      baseColor = palette.high;
    }

    const brightnessMod = 0.8 + Math.max(cascadeIntensity, conflictIntensity) * Math.max(0, Number(this.config.brightnessModulationDepth) || 0.2);
    this._tmpParticleColor.copy(baseColor).multiplyScalar(brightnessMod);
    state.color.lerp(this._tmpParticleColor, Math.max(0, Math.min(1, Number(this.config.colorEMAAlpha) || 0)));
    state.colorRGB.r = state.color.r;
    state.colorRGB.g = state.color.g;
    state.colorRGB.b = state.color.b;
    state.colorHex = state.color.getHexString();

    u.cascadeParticleColor = state.color;
    u.cascadeParticleColorRGB = state.colorRGB;
    u.cascadeParticleColorHex = state.colorHex;
    u.cascadeConflictType = conflictType;
  }

  _updateLinkSemanticDensity(link, state, conflictSystem, cascadeIntensity, deltaTime, now) {
    if (this.config.particleSemanticDensityEnabled === false) {
      return;
    }

    const u = link.userData;
    const prevCascade = Number(u._prevCascadeIntensity ?? 0) || 0;
    const currCascade = Number(u.cascadeIntensity ?? cascadeIntensity ?? 0) || 0;
    const cascadeChange = Math.abs(currCascade - prevCascade);

    let urgency = Math.max(0, Math.min(1, cascadeChange * 5));
    if (conflictSystem && typeof conflictSystem.getConflictState === 'function') {
      const conflictInfo = conflictSystem.getConflictState();
      const timeInConflict = Number(u._timeInConflict ?? 0) || 0;
      const conflictPersistence = Math.min(1, timeInConflict / 3.0);
      urgency = Math.max(urgency, conflictPersistence * 0.7);
      if (u.cascadeOscillation) {
        urgency = Math.max(urgency, Math.abs(Number(u.cascadeOscillation) || 0) * 0.6);
      }
    }

    if (u.synapticFatigue) {
      const fatigue = Number(u.synapticFatigue) || 0;
      const fatigueUrgency = Math.max(0, (fatigue - 0.5) * 2);
      urgency = Math.max(urgency, fatigueUrgency * 0.5);
    }

    state.intensitySmoothed = this._smoothValue(
      Number(state.intensitySmoothed ?? 0) || 0,
      cascadeIntensity,
      this.config.intensityEMAAlpha,
      deltaTime
    );
    state.urgencySmoothed = this._smoothValue(
      Number(state.urgencySmoothed ?? 0) || 0,
      urgency,
      this.config.urgencyEMAAlpha,
      deltaTime
    );

    const densityMultiplier = 1.0 + (state.intensitySmoothed * state.intensitySmoothed) * (Math.max(1.0, Number(this.config.maxDensityMultiplier) || 4.0) - 1.0);
    const clusterCohesion = Math.max(0, Math.min(
      Math.max(0, Number(this.config.maxClusterCohesion) || 1.0),
      state.urgencySmoothed * Math.max(0, Number(this.config.maxClusterCohesion) || 1.0)
    ));
    const minClusterRadius = Math.max(0, Number(this.config.minClusterRadius) || 0.1);
    const maxClusterRadius = Math.max(minClusterRadius, Number(this.config.maxClusterRadius) || 2.0);
    const clusterRadius = Math.max(
      minClusterRadius,
      Math.min(
        maxClusterRadius,
        maxClusterRadius - (clusterCohesion * (maxClusterRadius - minClusterRadius))
      )
    );
    const urgencyOscillation = Math.sin(this._semanticTime * 0.003 * (1 + state.urgencySmoothed * 5)) * state.urgencySmoothed;

    state.densityMultiplier = Math.min(
      densityMultiplier,
      Math.max(1.0, Number(this.config.densitySafetyThreshold) || 3.5)
    );
    state.clusterCohesion = clusterCohesion;
    state.clusterRadius = clusterRadius;
    state.urgencyOscillation = urgencyOscillation;
    state.conflictType = u.cascadeConflictType || state.conflictType || 'none';
    state.conflictIntensity = Math.max(0, Math.min(1, Number(u.cascadeIntensity ?? cascadeIntensity ?? 0) || 0));
    state.lastUpdateTime = now;

    u.particleIntensity = state.intensitySmoothed;
    u.particleUrgency = state.urgencySmoothed;
    u.particleDensityMultiplier = state.densityMultiplier;
    u.particleClusterCohesion = state.clusterCohesion;
    u.particleClusterRadius = state.clusterRadius;
    u.particleUrgencyOscillation = state.urgencyOscillation;
    u.__canonicalWriteAt = u.__canonicalWriteAt || {};
    u.__canonicalWriteAt.particleIntensity = now;
    u.__canonicalWriteAt.particleUrgency = now;
  }

  _cleanupInactiveSemanticStates() {
    const keysToDelete = [];
    for (const [key, state] of this._semanticLinkState.entries()) {
      const lowIntensity = Number(state.intensitySmoothed ?? 0) < 0.01;
      const lowUrgency = Number(state.urgencySmoothed ?? 0) < 0.01;
      const nearNeutralBoost = Math.abs(Number(state.emissionBoostSmoothed ?? 1) - 1) < 0.01;
      const noHop = !this._cascadeHopState.has(key);
      if (lowIntensity && lowUrgency && nearNeutralBoost && noHop) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this._semanticLinkState.delete(key);
    }
  }

  getSemanticLayerStats() {
    return {
      ...this._semanticStats,
      trackedLinks: this._semanticLinkState.size,
      activeHopSignals: this._cascadeHopState.size,
    };
  }

  clearWorldState() {
    this._cascadeHopState.clear();
    this._semanticLinkState.clear();
    this._semanticStats.activeBoosts = 0;
    this._semanticStats.activeColorTints = 0;
    this._semanticStats.activeLinkCount = 0;
    this._semanticStats.avgIntensity = 0;
    this._semanticStats.avgUrgency = 0;
    this._semanticStats.conflictTypeDistribution = {};
    this._semanticStats.totalEmissionMultiplier = 0;
    this._semanticStats.peakEmissionMultiplier = 1;
    this._semanticRefreshRequested = false;
  }

  reset() {
    this.clearWorldState();
  }

  /**
   * Update trail rendering
   */
  _updateTrailLayer(deltaTime) {
    if (!this.trailMesh || !this.trailGeometry || !this.trailMaterial || this.config.trailEnabled === false) {
      return;
    }

    const safeDelta = Number.isFinite(deltaTime) && deltaTime > 0 ? deltaTime : 0;
    this._updateExistingTrailParticles(safeDelta);
    this._spawnNewTrailParticles(safeDelta);
    this._updateTrailGPUBuffers();
  }

  _updateExistingTrailParticles(deltaTime) {
    let compactIndex = 0;

    for (let i = 0; i < this.trailPool.length; i++) {
      const trail = this.trailPool[i];
      if (!trail.active) continue;

      trail.age += deltaTime;

      if (trail.age >= trail.lifetime) {
        trail.active = false;
        continue;
      }

      if (compactIndex !== i) {
        const swap = this.trailPool[compactIndex];
        this.trailPool[compactIndex] = trail;
        this.trailPool[i] = swap;
      }

      compactIndex++;
    }

    this.activeTrailCount = compactIndex;
    this.trailStats.activeTrails = compactIndex;
  }

  _spawnNewTrailParticles(deltaTime) {
    if (!Array.isArray(this._activeParticleIndices) || this._activeParticleIndices.length === 0) {
      return;
    }

    const emissionRate = Math.max(0, Math.min(1, Number(this.config.trailEmissionRate) || 0));
    if (emissionRate <= 0) {
      return;
    }

    for (let i = 0; i < this._activeParticleIndices.length; i++) {
      const poolIndex = this._activeParticleIndices[i];
      const particle = this.pool[poolIndex];
      if (!particle?.active) continue;
      if (Math.random() > emissionRate) continue;

      const flowType = String(particle.flowType ?? 'forward').toLowerCase();
      if (flowType !== 'forward') continue;

      const parentSize = Number.isFinite(particle.size)
        ? particle.size
        : Number.isFinite(this.config.baseSize)
          ? Math.max(1, this.config.baseSize * 0.18)
          : 1;
      const trailColor = this._tmpParticleColor.copy(particle.sourceColor ?? this._neutralParticleColor).lerp(
        particle.targetColor ?? this._neutralParticleColor,
        Math.max(0, Math.min(1, Number(particle.pathProgress ?? 0)))
      );

      this._spawnTrail(particle, trailColor, parentSize, deltaTime);
    }
  }

  _spawnTrail(particle, color, parentSize, deltaTime = 0.016) {
    const particleIndex = Number.isFinite(particle?.index) ? particle.index : -1;
    if (particleIndex < 0) return;

    let trail = null;
    if (this.activeTrailCount < this.config.maxTrailParticles) {
      trail = this.trailPool[this.activeTrailCount];
      this.activeTrailCount++;
    } else {
      trail = this.trailPool[0];
    }

    if (!trail) return;

    const position = particle.position ?? this._trailScratchPosition.set(0, 0, 0);
    const spawnTime = Number.isFinite(particle.spawnTime) ? particle.spawnTime : 0;
    const historyState = this._trailPositionHistory.get(particleIndex);
    const spawnChanged = !historyState || historyState.spawnTime !== spawnTime;
    const previousPosition = !spawnChanged ? historyState.lastPosition : null;

    const fallbackDirection = this._resolveTrailFallbackDirection(particle);
    const motionDelta = previousPosition ? this._trailScratchDelta.copy(position).sub(previousPosition) : null;
    const motionDistance = motionDelta ? motionDelta.length() : 0;
    const direction = motionDistance > 1e-6
      ? this._trailScratchDirection.copy(motionDelta).multiplyScalar(1 / motionDistance)
      : fallbackDirection;
    const speed = motionDistance > 1e-6 ? motionDistance / Math.max(deltaTime, 1e-4) : 0.75;

    if (historyState) {
      historyState.spawnTime = spawnTime;
      historyState.lastPosition.copy(position);
    } else {
      this._trailPositionHistory.set(particleIndex, {
        spawnTime,
        lastPosition: new THREE.Vector3(position.x, position.y, position.z),
      });
    }

    const trailLength = THREE.MathUtils.clamp(
      speed * this.config.trailLengthFactor,
      this.config.minTrailLength,
      this.config.maxTrailLength
    );
    const trailPos = this._trailScratchPosition.copy(position).addScaledVector(direction, -trailLength * 0.5);

    trail.position.copy(trailPos);
    trail.prevPosition.copy(position);
    trail.velocity.copy(direction).multiplyScalar(speed);
    trail.color.copy(color);
    trail.age = 0;
    trail.lifetime = this.config.trailLifetime;
    trail.length = trailLength;
    trail.size = parentSize * 0.7;
    trail.active = true;
    trail.particleIndex = particleIndex;
    trail.spawnTime = spawnTime;

    this.trailStats.trailsSpawned++;
    this.trailStats.totalTrailLength += trailLength;
  }

  _resolveTrailFallbackDirection(particle) {
    const source = particle?.sourcePosition;
    const target = particle?.targetPosition;

    if (source?.isVector3 && target?.isVector3) {
      const direction = this._trailScratchDirection.copy(target).sub(source);
      if (direction.lengthSq() > 1e-6) {
        return direction.normalize();
      }
    }

    if (particle?.pathDirection === -1) {
      return this._trailScratchDirection.set(-1, 0, 0);
    }

    return this._trailScratchDirection.set(1, 0, 0);
  }

  _updateTrailGPUBuffers() {
    if (!this.trailGeometry || !this.trailMesh) {
      return;
    }

    const positions = this.trailGeometry.getAttribute('position').array;
    const colors = this.trailGeometry.getAttribute('color').array;
    const sizes = this.trailGeometry.getAttribute('size').array;
    const ages = this.trailGeometry.getAttribute('age').array;
    const lengths = this.trailGeometry.getAttribute('length').array;

    let activeCount = 0;

    for (let i = 0; i < this.activeTrailCount; i++) {
      const trail = this.trailPool[i];
      if (!trail.active) continue;

      const idx = activeCount;
      positions[idx * 3] = trail.position.x;
      positions[idx * 3 + 1] = trail.position.y;
      positions[idx * 3 + 2] = trail.position.z;

      colors[idx * 3] = trail.color.r;
      colors[idx * 3 + 1] = trail.color.g;
      colors[idx * 3 + 2] = trail.color.b;

      sizes[idx] = trail.size;
      ages[idx] = trail.age;
      lengths[idx] = trail.length;

      activeCount++;
    }

    this.trailStats.activeTrails = activeCount;

    this.trailGeometry.getAttribute('position').needsUpdate = true;
    this.trailGeometry.getAttribute('color').needsUpdate = true;
    this.trailGeometry.getAttribute('size').needsUpdate = true;
    this.trailGeometry.getAttribute('age').needsUpdate = true;
    this.trailGeometry.getAttribute('length').needsUpdate = true;
    this.trailGeometry.setDrawRange(0, activeCount);
  }

  getTrailStats() {
    return {
      ...this.trailStats,
      poolUtilization: this.config.maxTrailParticles > 0
        ? `${((this.activeTrailCount / this.config.maxTrailParticles) * 100).toFixed(1)}%`
        : '0.0%',
    };
  }

  resetTrailLayer() {
    this.activeTrailCount = 0;
    for (const trail of this.trailPool) {
      trail.active = false;
    }
    this._trailPositionHistory.clear();
    this.trailStats.trailsSpawned = 0;
    this.trailStats.activeTrails = 0;
    this.trailStats.totalTrailLength = 0;
    if (this.trailGeometry) {
      this.trailGeometry.setDrawRange(0, 0);
    }
  }
  
  /**
   * Update Loop
   */
  update(deltaTime, links, camera = null, cascadeSystem = null, conflictSystem = null) {
    const allLinks = Array.isArray(links) ? links : [];
    const resolvedLinks = this._resolveActiveLinks(allLinks);
    this._currentCamera = camera ?? null;
    this._ensureMeshAttached();
    if (this._cascadeTimeOrigin === undefined) {
      this._cascadeTimeOrigin = VisualTime.now;
    }
    const currentCascadeTime = VisualTime.now - this._cascadeTimeOrigin; // canonical VisualTime source
    const cascadeDelta = this._lastCascadeTime === undefined
      ? 0
      : Math.max(0, currentCascadeTime - this._lastCascadeTime);
    this._lastCascadeTime = currentCascadeTime;

    this._activeLinks = resolvedLinks;
    this._activeLinkIdSet.clear();
    for (let i = 0; i < resolvedLinks.length; i++) {
      const linkId = resolvedLinks[i]?.id;
      if (linkId !== undefined && linkId !== null) {
        this._activeLinkIdSet.add(linkId);
      }
    }

    this._ensureCanonicalLinkDefaults(resolvedLinks);

    // Process lifecycle events first so newly created/updated links can emit immediately.
    this._flushPendingLinkEvents(currentCascadeTime);

    // Safety net: if lifecycle callbacks missed a link, treat first-seen active links as created.
    this._syncFirstSeenActiveLinks(resolvedLinks, currentCascadeTime);

    // Update semantic particle layers before spawning so the current frame sees fresh link state.
    this._updateSemanticLayers(cascadeDelta, allLinks, cascadeSystem, conflictSystem);

    // Update existing active particles.
    this._updateParticles(cascadeDelta, currentCascadeTime, this._currentCamera);

    // Fallback spawn for links that have not yet emitted through lifecycle callbacks.
    this._spawnParticles(cascadeDelta, resolvedLinks, currentCascadeTime);

    this.activeCount = this._activeParticleIndices.length;
    this._updateTrailLayer(cascadeDelta);

    // Update geometry and helper visuals.
    this._updateGeometry();
    this._updateDebugHelpers(resolvedLinks);
    
    // Debug: log active particle count periodically
    // Log active particle status periodically
    if (this.config.debugMode && this.activeCount > 0 && Math.random() < 0.05) {
      const posAttr = this.geometry.attributes.position;
      const sizeAttr = this.geometry.attributes.size;
      // Find first active particle's position
      const firstActiveIdx = this._activeParticleIndices[0] ?? -1;
      const idx = firstActiveIdx >= 0 ? firstActiveIdx : 0;
      this._logger.log('Active:', this.activeCount,
        '| mesh.visible:', this.mesh?.visible,
        '| inScene:', this.scene?.children.includes(this.mesh),
        '| firstActiveIdx:', firstActiveIdx,
        '| pos:', idx, ':', posAttr.array[idx*3].toFixed(2), posAttr.array[idx*3+1].toFixed(2), posAttr.array[idx*3+2].toFixed(2),
        '| size:', idx, ':', sizeAttr.array[idx].toFixed(2));
    }
  }

  _ensureMeshAttached() {
    if (!this.scene || !this.mesh) return;
    if (this.mesh.parent !== this.scene) {
      this.scene.add(this.mesh);
    }
  }

  _bindTopologyBiasAccentSubscriptions() {
    this._unbindTopologyBiasAccentSubscriptions();

    const bus = this.semanticBus ?? globalThis?.semanticBus ?? null;
    if (!bus) return;

    this.semanticBus = bus;
    this._topologyBiasAccentBound = (payload = {}) => this._handleTopologyBiasSnapshot(payload);

    {
      const disposer = eventRegistrationRegistry.register(
        'CascadeParticleSystem', 'topology.bias.snapshot', this._topologyBiasAccentBound, bus
      );
      this._topologyBiasAccentUnsubscribers.push(disposer);
    }
  }

  _unbindTopologyBiasAccentSubscriptions() {
    if (!Array.isArray(this._topologyBiasAccentUnsubscribers) || this._topologyBiasAccentUnsubscribers.length === 0) return;
    for (const unsub of this._topologyBiasAccentUnsubscribers) {
      try { unsub?.(); } catch (_) {}
    }
    this._topologyBiasAccentUnsubscribers.length = 0;
  }

  _getTopologyBiasAccentCooldownKey(snapshot = {}, index = 0) {
    const influence = snapshot?.recentInfluencePositions?.[index];
    const position = influence?.position;
    if (!position?.x && !position?.y && !position?.z) {
      return `topo-accent-${index}`;
    }
    return `topo-accent-${Math.round(position.x * 2)}:${Math.round(position.y * 2)}:${Math.round(position.z * 2)}:${index}`;
  }

  _handleTopologyBiasSnapshot(snapshot = {}) {
    if (!snapshot || snapshot.scope !== 'topology') return;

    const influences = Array.isArray(snapshot.recentInfluencePositions) ? snapshot.recentInfluencePositions : [];
    if (influences.length === 0) return;

    const currentCascadeTime = this._lastCascadeTime ?? ((this._cascadeTimeOrigin !== undefined) ? (VisualTime.now - this._cascadeTimeOrigin) : 0);
    const baseIntensity = Math.max(
      0.04,
      Math.min(
        0.18,
        Number(snapshot.stabilityPulse ?? 0) * 0.10 +
        Number(snapshot.networkState?.synergy ?? 0) * 0.07 +
        Number(snapshot.networkState?.harmony ?? 0) * 0.05 +
        Number(snapshot.activeFlowCells ?? 0) * 0.015
      )
    );

    for (let i = 0; i < Math.min(2, influences.length); i++) {
      const influence = influences[i];
      const position = influence?.position?.clone?.() ?? null;
      if (!position) continue;

      const cooldownKey = this._getTopologyBiasAccentCooldownKey(snapshot, i);
      const lastAt = this._topologyBiasAccentCooldowns.get(cooldownKey);
      if (lastAt !== undefined && (currentCascadeTime - lastAt) < 1.8) {
        continue;
      }
      this._topologyBiasAccentCooldowns.set(cooldownKey, currentCascadeTime);

      const sourceNode = {
        position: position.clone().add(new THREE.Vector3(-0.14, 0.03, 0.02)),
        userData: { category: 'analytics' }
      };
      const targetNode = {
        position: position.clone().add(new THREE.Vector3(0.14, -0.02, -0.02)),
        userData: { category: 'integration' }
      };
      const syntheticLink = {
        id: `topology-accent-${cooldownKey}`,
        active: true,
        source: sourceNode,
        target: targetNode,
        sourceNode,
        targetNode,
        userData: {
          cascadeIntensity: baseIntensity,
          particleDensityMultiplier: 0.18,
          cascadeParticleEmissionBoost: 0.22,
          cascadeConflictType: 'neutral',
          flowState: {
            intensity: baseIntensity,
            direction: 1,
            type: 'neutral',
            energy: baseIntensity
          }
        }
      };

      const count = 1;
      this._emit(
        count,
        syntheticLink,
        this._getShapeIndexForConflict('neutral'),
        'forward',
        'neutral',
        currentCascadeTime,
        sourceNode.position,
        targetNode.position,
        {
          opacityScale: 0.10 + baseIntensity * 0.08,
          densityScale: 0.14,
          distanceScale: 0.34
        }
      );
    }
  }

  spawnCascadeParticles(link, intensity = 0, hopIndex = 0, camera = null) {
    if (!this.config.enabled || !link) return;

    this._ensureCanonicalLinkDefaults([link]);

    const sourceNode = link?.source ?? link?.sourceNode ?? link?.from ?? null;
    const targetNode = link?.target ?? link?.targetNode ?? link?.to ?? null;
    const sourcePosition = this._resolveWorldPosition(sourceNode, this._tmpSourceWorldPos);
    const targetPosition = this._resolveWorldPosition(targetNode, this._tmpTargetWorldPos);
    if (!sourcePosition || !targetPosition) return;

    if (!intensity) intensity = 0;

    const eventIntensity = Math.max(0, Math.min(1, Number(intensity) || 0));
    const canonicalIntensity = Math.max(
      0,
      Math.min(1, Number(link?.userData?.metrics?.synergy ?? 0) || 0)
    );
    const clampedIntensity = Math.max(eventIntensity, canonicalIntensity);
    if (clampedIntensity < this.config.minimumVisibleIntensity) return;

    const hop = Math.max(0, Number(hopIndex) || 0);
    const hopDecay = Math.pow(this.config.hopDecay, hop);
    const scaledIntensity = Math.max(0, Math.min(1, clampedIntensity * hopDecay));
    const count = Math.max(1, Math.floor(this.config.baseCascadeParticles * scaledIntensity));
    const currentCascadeTime = this._lastCascadeTime ?? 0;
    const conflictType =
      link?.userData?.cascadeConflictType ||
      link?.userData?.flowState?.type ||
      'neutral';
    const shapeIndex = this._getShapeIndexForConflict(conflictType);
    const flowType = this._determineFlowType(conflictType, scaledIntensity);
    const lod = this._getCascadeLinkLod(link, camera ?? this._currentCamera);

    this._emit(count, link, shapeIndex, flowType, conflictType, currentCascadeTime, sourcePosition, targetPosition, lod);
  }
  
  /**
   * Fallback spawn for active links that have not yet emitted via lifecycle callbacks.
   */
  _spawnParticles(deltaTime, links, currentCascadeTime) {
    if (!Array.isArray(links) || links.length === 0) return;
    for (const link of links) {
      if (!link?.id || link.active === false) continue;
      const linkState = this._getCascadeLinkState(link, this._currentCamera);
      // FIX: Removed isRelevant gating — links without cascade-specific data
      // (where intensity defaults to 0) were never spawning particles.
      // The _emitFromLinkState already has this check disabled too.
      // if (!linkState.isRelevant) continue;
      // Instead, use a minimum fallback intensity for links with no cascade data
      if (linkState.intensity <= 0 && !link?.userData?.cascadeIntensity && !link?.userData?.flowState?.intensity) {
        // Provide baseline intensity from synergy metric so normal links can spawn
        const synergy = Number(link?.userData?.metrics?.synergy ?? 0) || 0;
        if (synergy < this.config.minimumVisibleIntensity) continue;
        // Patch: set a minimum intensity so _emitFromLinkState can proceed
        linkState.intensity = Math.max(0.08, synergy);
        linkState.isRelevant = true;
      }
      const spawnState = this._linkSpawnState.get(link.id);
      const emissionInterval = this._getEmissionInterval(linkState);
      const lastSpawnTime = spawnState?.lastSpawnTime ?? -Infinity;
      if (currentCascadeTime - lastSpawnTime < emissionInterval) continue;
      const emitted = this._emitFromLinkState(link, linkState, currentCascadeTime);
      if (emitted > 0) {
        this._linkSpawnState.set(link.id, {
          ...linkState,
          lastSpawnTime: currentCascadeTime,
          lastEventType: spawnState?.hasSpawned ? 'topup' : 'fallback',
          hasSpawned: true
        });
      }
    }
  }

  _flushPendingLinkEvents(currentCascadeTime) {
    if (!this._pendingLinkEvents.length) return;

    const events = this._pendingLinkEvents.splice(0, this._pendingLinkEvents.length);
    for (const event of events) {
      const link = event?.link;
      const linkId = event?.linkId || link?.id || link?.uuid || link?.name;
      if (!linkId) continue;

      if (event.type === 'destroyed') {
        this._linkSpawnState.delete(linkId);
        this.clearLink(linkId);
        continue;
      }

      if (!link || link.active === false || !this._activeLinkIdSet.has(linkId)) {
        continue;
      }

      const emitted = this._spawnFromLifecycleEvent(link, event.type, currentCascadeTime);
      if (emitted > 0) {
        const currentState = this._getCascadeLinkState(link, this._currentCamera);
        this._linkSpawnState.set(linkId, {
          ...currentState,
          lastSpawnTime: currentCascadeTime,
          lastEventType: event.type,
          hasSpawned: true
        });
      }
    }
  }

  _syncFirstSeenActiveLinks(links, currentCascadeTime) {
    for (const link of links) {
      if (!link?.id || this._linkSpawnState.has(link.id)) continue;
      this._spawnFromLifecycleEvent(link, 'created', currentCascadeTime);
    }
  }

  _spawnFromLifecycleEvent(link, eventType, currentCascadeTime) {
    if (!link?.id || link.active === false) return 0;

    this._ensureCanonicalLinkDefaults([link]);
    const currentState = this._getCascadeLinkState(link, this._currentCamera);
    if (!currentState.isRelevant) {
      this._linkSpawnState.set(link.id, currentState);
      return 0;
    }

    const previousState = this._linkSpawnState.get(link.id);
    const previousSignature = previousState?.signature ?? null;
    const cooldown = this.config.cascadeHopCooldown ?? 0.3;
    const lastSpawnTime = previousState?.lastSpawnTime ?? -Infinity;
    const shouldIgnoreCooldown = eventType === 'created';

    if (eventType === 'updated' && previousSignature === currentState.signature) {
      this._linkSpawnState.set(link.id, {
        ...currentState,
        lastSpawnTime,
        lastEventType: eventType,
        hasSpawned: previousState?.hasSpawned ?? false
      });
      return 0;
    }

    if (!shouldIgnoreCooldown && currentCascadeTime - lastSpawnTime < cooldown) {
      this._linkSpawnState.set(link.id, {
        ...currentState,
        lastSpawnTime,
        lastEventType: eventType,
        hasSpawned: previousState?.hasSpawned ?? false
      });
      return 0;
    }

    const emitted = this._emitFromLinkState(link, currentState, currentCascadeTime);
    if (emitted > 0) {
      this._linkSpawnState.set(link.id, {
        ...currentState,
        lastSpawnTime: currentCascadeTime,
        lastEventType: eventType,
        hasSpawned: true
      });
    } else {
      this._linkSpawnState.set(link.id, {
        ...currentState,
        lastSpawnTime,
        lastEventType: eventType,
        hasSpawned: previousState?.hasSpawned ?? false
      });
    }
    return emitted;
  }

  _emitFromLinkState(link, linkState, currentCascadeTime) {
    if (!linkState?.isRelevant) return;

    const sourceNode = link?.source ?? link?.sourceNode ?? link?.from ?? null;
    const targetNode = link?.target ?? link?.targetNode ?? link?.to ?? null;
    const sourcePosition = this._resolveWorldPosition(sourceNode, this._tmpSourceWorldPos);
    const targetPosition = this._resolveWorldPosition(targetNode, this._tmpTargetWorldPos);
    if (!sourcePosition || !targetPosition) return;

    const desiredCount = Math.max(1, Math.floor(this.config.baseCascadeParticles * linkState.intensity));
    const count = this._clampSpawnCountToLink(link, desiredCount);
    if (count <= 0) return 0;

    return this._emit(
      count,
      link,
      linkState.shapeIndex,
      linkState.flowType,
      linkState.conflictType,
      currentCascadeTime,
      sourcePosition,
      targetPosition,
      linkState
    );
  }

  _getActiveParticleCountForLink(linkId) {
    if (!linkId) return 0;
    let active = 0;
    for (let i = 0; i < this._activeParticleIndices.length; i++) {
      const p = this.pool[this._activeParticleIndices[i]];
      if (p.active && p.linkRef?.id === linkId) {
        active++;
      }
    }
    return active;
  }

  _clampSpawnCountToLink(link, desiredCount) {
    const linkId = link?.id;
    if (!linkId) return 0;
    const cap = Math.max(1, Math.floor(Number(this.config.perLinkCap ?? 20) || 20));
    const active = this._getActiveParticleCountForLink(linkId);
    const available = Math.max(0, cap - active);
    return Math.max(0, Math.min(desiredCount, available));
  }

  _getLinkSpawnState(link) {
    if (!link?.id) return null;
    return this._linkSpawnState.get(link.id) || null;
  }

  _getCascadeLinkState(link, camera = null) {
    const u = link?.userData || {};
    const flowState = u.flowState || {};
    const canonicalIntensitySources = [
      u.cascadeIntensity,
      flowState.intensity,
      u.metrics?.synergy,
      u.synergy?.score,
      link?.synergyScore
    ];
    const cascadeIntensity = canonicalIntensitySources.reduce((max, value) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    const normalizedIntensity = Math.max(0, Math.min(1, cascadeIntensity));
    const conflictType = u.cascadeConflictType || flowState.type || 'neutral';
    const boost = Number(u.cascadeParticleEmissionBoost ?? 1.0) || 1.0;
    const density = Number(u.particleDensityMultiplier ?? 1.0) || 1.0;
    const lod = this._getCascadeLinkLod(link, camera);
    const lodDensity = Math.max(0.15, Math.min(1, Number(lod?.densityScale ?? 1) || 1));
    const lodOpacity = Math.max(0.15, Math.min(1, Number(lod?.opacityScale ?? 1) || 1));
    const relevantIntensity = normalizedIntensity * boost * density * lodDensity;
    const isRelevant = relevantIntensity >= this.config.minimumVisibleIntensity;
    const shapeIndex = this._getShapeIndexForConflict(conflictType);
    const flowType = this._determineFlowType(conflictType, relevantIntensity);
    const signature = [
      link?.active === false ? '0' : '1',
      conflictType,
      shapeIndex,
      flowType,
      Math.round(relevantIntensity * 20),
      Math.round(boost * 10),
      Math.round(density * 10),
      Math.round(lodDensity * 10)
    ].join('|');

    return {
      signature,
      intensity: relevantIntensity,
      conflictType,
      shapeIndex,
      flowType,
      isRelevant,
      densityScale: lodDensity,
      opacityScale: lodOpacity,
      distanceScale: lod?.distanceScale ?? 1
    };
  }

  _getCascadeLinkLod(link, camera = null) {
    const lodConfig = this.config.lod || {};
    if (!lodConfig.enabled || !camera?.position) {
      return {
        distanceScale: 1,
        densityScale: 1,
        opacityScale: 1,
        distance: 0
      };
    }

    const sourceNode = link?.source ?? link?.sourceNode ?? link?.from ?? null;
    const targetNode = link?.target ?? link?.targetNode ?? link?.to ?? null;
    const sourcePos = this._resolveWorldPosition(sourceNode, this._tmpSourceWorldPos);
    const targetPos = this._resolveWorldPosition(targetNode, this._tmpTargetWorldPos);
    if (!sourcePos || !targetPos) {
      return {
        distanceScale: 1,
        densityScale: 1,
        opacityScale: 1,
        distance: 0
      };
    }

    this._tmpMidpoint.lerpVectors(sourcePos, targetPos, 0.5);
    const distance = camera.position.distanceTo(this._tmpMidpoint);
    const near = Math.max(0.001, Number(lodConfig.nearDistance) || 0.001);
    const far = Math.max(near + 0.001, Number(lodConfig.farDistance) || near + 0.001);
    const t = Math.max(0, Math.min(1, (distance - near) / (far - near)));
    const smooth = t * t * (3 - 2 * t);
    const minDensity = Math.max(0.05, Math.min(1, Number(lodConfig.minDensity) || 1));
    const minOpacity = Math.max(0.05, Math.min(1, Number(lodConfig.minOpacity) || 1));
    const densityScale = 1 - (1 - minDensity) * smooth;
    const opacityScale = 1 - (1 - minOpacity) * smooth;

    return {
      distanceScale: 1 - smooth,
      densityScale,
      opacityScale,
      distance
    };
  }

  _getEmissionInterval(linkState) {
    const intensity = Math.max(0, Math.min(1, Number(linkState?.intensity ?? 0) || 0));
    const baseRate = Math.max(0.5, Number(this.config.emissionRate) || 0.5);
    const intensityRate = baseRate * (0.35 + intensity * 0.95);
    return Math.max(0.14, Math.min(0.65, 1 / Math.max(0.5, intensityRate)));
  }
  
  /**
   * Emit N particles for a link
   * Respects semantic density and clustering parameters
   */
  _emit(count, link, shapeIndex, flowType, conflictType, currentCascadeTime, sourcePosition = null, targetPosition = null, lodState = null) {
    const cappedCount = this._clampSpawnCountToLink(link, count);
    if (cappedCount <= 0) {
      return 0;
    }

    const srcPos = sourcePosition ?? this._resolveWorldPosition(link?.source ?? link?.sourceNode ?? link?.from ?? null, this._tmpSourceWorldPos);
    const dstPos = targetPosition ?? this._resolveWorldPosition(link?.target ?? link?.targetNode ?? link?.to ?? null, this._tmpTargetWorldPos);
    if (!srcPos || !dstPos) {
      this._logger.logIf(this.config.debugMode, '_emit: missing positions', { srcPos, dstPos, linkId: link?.id });
      return;
    }
    
    // Validate positions are finite numbers
    if (!Number.isFinite(srcPos.x) || !Number.isFinite(srcPos.y) || !Number.isFinite(srcPos.z) ||
        !Number.isFinite(dstPos.x) || !Number.isFinite(dstPos.y) || !Number.isFinite(dstPos.z)) {
      this._logger.logIf(this.config.debugMode, '_emit: INVALID positions - NaN or Infinity detected', {
        src: { x: srcPos.x, y: srcPos.y, z: srcPos.z },
        dst: { x: dstPos.x, y: dstPos.y, z: dstPos.z }
      });
      return;
    }
    
    this._logger.logIf(this.config.debugMode, '_emit: spawning', count, 'particles | src:',
      srcPos.x.toFixed(2), srcPos.y.toFixed(2), srcPos.z.toFixed(2),
      '| dst:', dstPos.x.toFixed(2), dstPos.y.toFixed(2), dstPos.z.toFixed(2));
    
    // Semantic density & clustering
    const clusterCohesion = link?.userData?.particleClusterCohesion ?? 0;
    const clusterRadius = link?.userData?.particleClusterRadius ?? 0.2;
    const urgencyOscillation = link?.userData?.particleUrgencyOscillation ?? 0;
    const sourceCategory = link?.source?.userData?.category || link?.sourceNode?.userData?.category || 'input';
    const targetCategory = link?.target?.userData?.category || link?.targetNode?.userData?.category || sourceCategory;
    const sourceColor = this._resolveCategoryColor(sourceCategory, this._neutralParticleColor, this._tmpSourceCategoryColor);
    const targetColor = this._resolveCategoryColor(targetCategory, this._neutralParticleColor, this._tmpTargetCategoryColor);
    const opacityScale = Math.max(0.15, Math.min(1, Number(lodState?.opacityScale ?? lodState?.lodOpacity ?? 1) || 1));
    
    for (let i = 0; i < cappedCount; i++) {
      const p = this._allocateParticle();
      if (!p) return i; // Pool full

      p.active = true;
      p.lifetime = 0;
      p.maxLifetime = 1.8 + Math.random() * 1.2;
      p.spawnTime = currentCascadeTime;
      
      p.linkRef = link;
      // CRITICAL: Copy values, not references! srcPos/dstPos are reused temp vectors
      if (srcPos) p.sourcePosition.set(srcPos.x, srcPos.y, srcPos.z);
      if (dstPos) p.targetPosition.set(dstPos.x, dstPos.y, dstPos.z);
      p.shapeIndex = shapeIndex;
      p.conflictType = conflictType;
      p.flowType = flowType;
      p.sourceColor.copy(sourceColor);
      p.targetColor.copy(targetColor);
      p.opacityScale = opacityScale;
      
      // Position along link: respects clustering
      // High cohesion = spawn particles closer together (cluster formation)
      if (clusterCohesion > 0.5) {
        // Tight cluster: spawn within narrow band
        const clusterCenter = Math.random();
        const clusterSpread = 0.05 * (1 - clusterCohesion); // Tighter at high cohesion
        p.pathProgress = clusterCenter + (Math.random() - 0.5) * clusterSpread;
      } else {
        // Loose distribution: spread across link
        p.pathProgress = Math.random();
      }
      
      p.pathProgress = Math.max(0, Math.min(1, p.pathProgress)); // Clamp
      p.pathDirection = (flowType === 'backflow') ? -1 : 1;
      
      // Lateral offset respects cluster radius
      const offsetAmt = clusterRadius;
      p.pathOffset.set(
        (Math.random() - 0.5) * offsetAmt,
        (Math.random() - 0.5) * offsetAmt,
        (Math.random() - 0.5) * offsetAmt
      );
      
      const renderSlot = p.activeListIndex;
      if (renderSlot < 0) {
        this._releaseParticle(
          p,
          renderSlot,
          this.geometry.attributes.position.array,
          this.geometry.attributes.color.array,
          this.geometry.attributes.opacity.array,
          this.geometry.attributes.size.array,
          this.geometry.attributes.angle.array,
          this.geometry.attributes.shapeIndex.array
        );
        continue;
      }
      
      // Initial update to set position
      this._updateSingleParticle(p, 0, currentCascadeTime);
      if (!p.active) {
        const positions = this.geometry.attributes.position.array;
        const colors = this.geometry.attributes.color.array;
        const opacities = this.geometry.attributes.opacity.array;
        const sizes = this.geometry.attributes.size.array;
        const angles = this.geometry.attributes.angle.array;
        const shapes = this.geometry.attributes.shapeIndex.array;
        this._releaseParticle(p, renderSlot, positions, colors, opacities, sizes, angles, shapes);
        continue;
      }

      // Shape
      const shapes = this.geometry.attributes.shapeIndex.array;
      const positions = this.geometry.attributes.position.array;
      const colors = this.geometry.attributes.color.array;
      const opacities = this.geometry.attributes.opacity.array;
      const sizes = this.geometry.attributes.size.array;
      const angles = this.geometry.attributes.angle.array;
      const spawnProgress = Math.max(0, Math.min(1, p.pathProgress));
      this._tmpParticleColor.copy(p.sourceColor).lerp(p.targetColor, spawnProgress);
      shapes[renderSlot] = shapeIndex;
      positions[renderSlot * 3] = p.position.x;
      positions[renderSlot * 3 + 1] = p.position.y;
      positions[renderSlot * 3 + 2] = p.position.z;
      colors[renderSlot * 3] = this._tmpParticleColor.r;
      colors[renderSlot * 3 + 1] = this._tmpParticleColor.g;
      colors[renderSlot * 3 + 2] = this._tmpParticleColor.b;
      opacities[renderSlot] = p.opacityScale;
      sizes[renderSlot] = this.config.baseSize * this.config.visualSizeBoost;
      angles[renderSlot] = 0;
    }

    return cappedCount;
  }
  
  /**
   * Update all active particles
   */
  _updateParticles(deltaTime, currentCascadeTime, camera = null) {
    const positions = this.geometry.attributes.position.array;
    const colors = this.geometry.attributes.color.array;
    const opacities = this.geometry.attributes.opacity.array;
    const sizes = this.geometry.attributes.size.array;
    const angles = this.geometry.attributes.angle.array;
    const shapes = this.geometry.attributes.shapeIndex.array;
    
    let diedFromAge = 0;
    let diedFromUpdate = 0;
    const activeParticles = this._activeParticleIndices;
    
    for (let activeIndex = 0; activeIndex < activeParticles.length;) {
      const poolIndex = activeParticles[activeIndex];
      const p = this.pool[poolIndex];
      if (!p || !p.active) {
        this._removeActiveParticleAt(
          activeIndex,
          positions,
          colors,
          opacities,
          sizes,
          angles,
          shapes
        );
        continue;
      }
      
      const age = currentCascadeTime - p.spawnTime;
      p.lifetime = age;
      if (age >= p.maxLifetime) {
        this._releaseParticle(p, activeIndex, positions, colors, opacities, sizes, angles, shapes);
        diedFromAge++;
        continue;
      }
      
      this._updateSingleParticle(p, deltaTime, currentCascadeTime);
      
      if (!p.active) {
        this._releaseParticle(p, activeIndex, positions, colors, opacities, sizes, angles, shapes);
        diedFromUpdate++;
        continue;
      }
      
      // Update Attributes
      const renderSlot = p.activeListIndex >= 0 ? p.activeListIndex : activeIndex;
      positions[renderSlot * 3] = p.position.x;
      positions[renderSlot * 3 + 1] = p.position.y;
      positions[renderSlot * 3 + 2] = p.position.z;

      const lodState = this._getCascadeLinkLod(p.linkRef, camera ?? this._currentCamera);
      p.opacityScale = Math.max(0.15, Math.min(1, Number(lodState?.opacityScale ?? p.opacityScale ?? 1) || 1));
      opacities[renderSlot] = p.opacityScale;
      
      // Fade out size
      const lifeRatio = age / p.maxLifetime;
      const fade = Math.sin(lifeRatio * Math.PI) * (0.88 + p.opacityScale * 0.12); // Smooth arc
      sizes[renderSlot] = this.config.baseSize * this.config.visualSizeBoost * fade;

      // Category-aware gradient color along the link path.
      const pathT = Math.max(0, Math.min(1, p.pathProgress));
      this._tmpParticleColor.copy(p.sourceColor).lerp(p.targetColor, pathT);
      const colorPulse = 0.88 + (1.0 - lifeRatio) * 0.12;
      colors[renderSlot * 3] = this._tmpParticleColor.r * colorPulse;
      colors[renderSlot * 3 + 1] = this._tmpParticleColor.g * colorPulse;
      colors[renderSlot * 3 + 2] = this._tmpParticleColor.b * colorPulse;
      
      // Rotate based on conflict type
      if (p.conflictType === 'stability' || p.conflictType === 'corruption') {
        angles[renderSlot] += deltaTime * 5.0; // Spin fast for chaos
      } else {
        // Align with path (approximation)
        angles[renderSlot] = 0;
      }
      
      activeIndex++;
    }
    
    this.activeCount = activeParticles.length;
    
    this._logger.logIf(this.config.debugMode && (diedFromAge > 0 || diedFromUpdate > 0), 
      'Particle deaths - age:', diedFromAge, 'update:', diedFromUpdate, 'surviving:', this.activeCount);
  }
  
  /**
   * Physics Update for Single Particle
   * Implements Task 2: Velocity Direction Encoding
   */
  _updateSingleParticle(p, deltaTime, currentCascadeTime) {
    const hasEndpoints = this._isValidWorldPosition(p.sourcePosition) && this._isValidWorldPosition(p.targetPosition);
    if (!hasEndpoints) {
      this._logger.logIf(this.config.debugMode, 'Particle dying: invalid endpoints', {
        src: p.sourcePosition ? { x: p.sourcePosition.x, y: p.sourcePosition.y, z: p.sourcePosition.z } : null,
        dst: p.targetPosition ? { x: p.targetPosition.x, y: p.targetPosition.y, z: p.targetPosition.z } : null
      });
      p.active = false;
      return;
    }
    
    // Advance progress
    let speed = 0.03; // Base speed (link length fraction per sec)
    
    if (p.flowType === 'oscillatory') {
      // Wiggle back and forth
      const osc = Math.sin(currentCascadeTime * 0.01) * 0.0015;
      p.pathProgress += osc;
    } else {
      // Forward or Backflow
      p.pathProgress += speed * deltaTime * p.pathDirection;
    }
    
    // Check bounds
    if (p.pathProgress < 0 || p.pathProgress > 1) {
      // Particle reached end of path - natural death, don't log
      p.active = false;
      return;
    }
    
    p.position.lerpVectors(p.sourcePosition, p.targetPosition, p.pathProgress);
    
    // Add offset
    p.position.add(p.pathOffset);
    
    // Add semantic motion noise
    if (p.conflictType === 'stability') {
      p.position.x += (Math.random() - 0.5) * 0.1;
      p.position.y += (Math.random() - 0.5) * 0.1;
      p.position.z += (Math.random() - 0.5) * 0.1;
    }
  }
  
  /**
   * Determine Flow Type based on context
   */
  _determineFlowType(conflictType, intensity) {
    // 1. Oscillatory Flow (Stalemate)
    if (conflictType === 'oscillatory_balance' || conflictType === 'destructive') {
      return 'oscillatory';
    }
    
    // 2. Backflow (Resistance)
    if (conflictType === 'fatigue_yield') {
      return 'backflow';
    }
    
    // 3. Forward Flow (Dominance)
    return 'forward';
  }

  _isValidWorldPosition(pos) {
    if (!pos) return false;
    if (
      !Number.isFinite(pos.x) ||
      !Number.isFinite(pos.y) ||
      !Number.isFinite(pos.z)
    ) return false;
    return true;
  }

  _resolveWorldPosition(node, outVec) {
    if (!node || !node.position) return null;
    const pos = (typeof node.getWorldPosition === 'function')
      ? node.getWorldPosition(outVec || this._tmpSourceWorldPos)
      : node.position;
    return this._isValidWorldPosition(pos) ? pos : null;
  }

  _getLinkLODLevel(link) {
    const controller = globalThis?.window?.ATOMA_DISTANCE_LOD;
    if (!controller || !link) return 0;

    const sourceNode = link?.source ?? link?.sourceNode ?? link?.from ?? null;
    const targetNode = link?.target ?? link?.targetNode ?? link?.to ?? null;
    const sourcePosition = this._resolveWorldPosition(sourceNode, this._tmpSourceWorldPos);
    const targetPosition = this._resolveWorldPosition(targetNode, this._tmpTargetWorldPos);
    if (!sourcePosition || !targetPosition) return 0;

    this._tmpMidpoint.copy(sourcePosition).add(targetPosition).multiplyScalar(0.5);
    const level = controller.getLODLevel(this._tmpMidpoint);
    return Number.isFinite(level) ? level : 0;
  }
  
  /**
   * Map conflict type to shape index
   */
  _getShapeIndexForConflict(type) {
    switch (type) {
      case 'destructive': return 0; // Phase (Arcs)
      case 'specialization_drift': return 1; // Polarity (Forks)
      case 'corruption': return 2; // Corruption (Shards)
      case 'oscillatory_balance': return 3; // stability (Blobs)
      case 'fatigue_yield': return 0; // Default to arcs
      case 'resolved_harmony': return 0;
      case 'neutral': return 0;
      default: return 0;
    }
  }

  _ensureCanonicalLinkDefaults(links) {
    if (!Array.isArray(links)) return;
    for (const link of links) {
      if (!link) continue;
      if (!link.userData) link.userData = {};
      const u = link.userData;

      if (!u.flowState) {
        u.flowState = {
          intensity: 0,
          direction: 1,
          type: 'neutral',
          energy: 0
        };
      }

      if (typeof u.cascadeIntensity !== 'number') u.cascadeIntensity = 0;
      if (typeof u.cascadeConflictType !== 'string' || !u.cascadeConflictType) u.cascadeConflictType = 'neutral';
      if (typeof u.conflictIntensity !== 'number') u.conflictIntensity = 0;
      if (typeof u.particleIntensity !== 'number') u.particleIntensity = 0;
      if (typeof u.particleUrgency !== 'number') u.particleUrgency = 0;
      if (typeof u.cascadeParticleEmissionBoost !== 'number') u.cascadeParticleEmissionBoost = 1;
      if (typeof u.particleDensityMultiplier !== 'number') u.particleDensityMultiplier = 1;
      if (!(u.cascadeParticleColor && u.cascadeParticleColor.isColor)) {
        u.cascadeParticleColor = this._neutralParticleColor.clone();
      }
      if (!u.cascadeParticleColorRGB && u.cascadeParticleColor?.isColor) {
        u.cascadeParticleColorRGB = {
          r: u.cascadeParticleColor.r,
          g: u.cascadeParticleColor.g,
          b: u.cascadeParticleColor.b
        };
      }
    }
  }

  _resolveParticleColor(link) {
    const color = this._tmpParticleColor;
    const tintColor = link?.userData?.cascadeParticleColor;

    if (tintColor?.isColor) {
      return color.copy(tintColor);
    }

    const tintRGB = link?.userData?.cascadeParticleColorRGB;
    if (tintRGB && Number.isFinite(tintRGB.r) && Number.isFinite(tintRGB.g) && Number.isFinite(tintRGB.b)) {
      return color.setRGB(tintRGB.r, tintRGB.g, tintRGB.b);
    }

    return color.copy(this._neutralParticleColor);
  }

  _resolveCategoryColor(category, fallbackColor = this._neutralParticleColor, outColor = this._tmpParticleColor) {
    return resolveLinkCategoryColor(category, fallbackColor, outColor);
  }

  _resolveActiveLinks(links) {
    const resolved = this._resolvedLinksScratch;
    resolved.length = 0;

    if (!Array.isArray(links) || links.length === 0) return resolved;

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (link && link.active !== false) {
        resolved.push(link);
      }
    }

    return resolved;
  }

  _initDebugHelpers() {
    if (!this.config.debugMode || !this.scene) return;

    this._debugHelpers = new THREE.Group();
    this._debugHelpers.name = 'CascadeParticleSystem_DebugHelpers';
    this.scene.add(this._debugHelpers);

    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthTest: false });
    const sourceMat = new THREE.MeshBasicMaterial({ color: 0xff4fd8, transparent: true, opacity: 0.95, depthTest: false });
    const targetMat = new THREE.MeshBasicMaterial({ color: 0x4ffff0, transparent: true, opacity: 0.95, depthTest: false });
    const particleGeo = new THREE.SphereGeometry(0.22, 8, 8);
    const endpointGeo = new THREE.SphereGeometry(0.3, 10, 10);

    for (let i = 0; i < this._debugMarkerCount; i++) {
      const particle = new THREE.Mesh(particleGeo, particleMat.clone());
      particle.visible = false;
      this._debugParticleMarkers.push(particle);
      this._debugHelpers.add(particle);
    }

    for (let i = 0; i < 8; i++) {
      const src = new THREE.Mesh(endpointGeo, sourceMat.clone());
      const dst = new THREE.Mesh(endpointGeo, targetMat.clone());
      src.visible = false;
      dst.visible = false;
      this._debugSourceMarkers.push(src);
      this._debugTargetMarkers.push(dst);
      this._debugHelpers.add(src);
      this._debugHelpers.add(dst);
    }
  }

  _updateDebugHelpers(links) {
    if (!this._debugHelpers) return;

    const activeParticles = this._activeParticleIndices;
    for (let i = 0; i < this._debugParticleMarkers.length; i++) {
      const marker = this._debugParticleMarkers[i];
      const particleIndex = activeParticles[i];
      const particle = particleIndex !== undefined ? this.pool[particleIndex] : null;
      if (particle) {
        marker.visible = true;
        marker.position.copy(particle.position);
        marker.scale.setScalar(Math.max(0.25, this.config.baseSize * 0.001));
      } else {
        marker.visible = false;
      }
    }

    for (let i = 0; i < this._debugSourceMarkers.length; i++) {
      const src = this._debugSourceMarkers[i];
      const dst = this._debugTargetMarkers[i];
      const link = links?.[i];
      if (link) {
        const sourceNode = link?.source ?? link?.sourceNode ?? link?.from ?? null;
        const targetNode = link?.target ?? link?.targetNode ?? link?.to ?? null;
        const sourcePos = this._resolveWorldPosition(sourceNode, this._tmpSourceWorldPos);
        const targetPos = this._resolveWorldPosition(targetNode, this._tmpTargetWorldPos);
        src.visible = !!sourcePos;
        dst.visible = !!targetPos;
        if (sourcePos) src.position.copy(sourcePos);
        if (targetPos) dst.position.copy(targetPos);
      } else {
        src.visible = false;
        dst.visible = false;
      }
    }
  }
  
  /**
   * Allocate particle from pool
   */
  _allocateParticle() {
    this._ensureFreeParticleIndices();

    const poolIndex = this._freeParticleIndices.pop();
    if (poolIndex === undefined) return null;

    const particle = this.pool[poolIndex];
    if (!particle) return null;

    particle.active = true;
    particle.activeListIndex = this._activeParticleIndices.length;
    this._activeParticleIndices.push(poolIndex);
    return particle;
  }

  _ensureFreeParticleIndices() {
    if (!Array.isArray(this._freeParticleIndices)) {
      this._freeParticleIndices = [];
    }

    if (this._freeParticleIndices.length > 0) {
      return;
    }

    if (!Array.isArray(this.pool) || this.pool.length === 0) {
      return;
    }

    // Rebuild from pool state if the free stack was cleared unexpectedly.
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const particle = this.pool[i];
      if (particle && particle.active !== true) {
        this._freeParticleIndices.push(i);
      }
    }
  }
  
  /**
   * Mark geometry attributes for update
   */
  _updateGeometry() {
    const activeCount = this.activeCount;
    if (activeCount <= 0) {
      this.geometry.setDrawRange(0, 0);
      return;
    }

    const positionAttribute = this.geometry.attributes.position;
    const colorAttribute = this.geometry.attributes.color;
    const opacityAttribute = this.geometry.attributes.opacity;
    const sizeAttribute = this.geometry.attributes.size;
    const angleAttribute = this.geometry.attributes.angle;
    const shapeIndexAttribute = this.geometry.attributes.shapeIndex;

    const markAttributeDirty = (attribute, count) => {
      if (!attribute) return;

      if (typeof attribute.clearUpdateRanges === 'function') {
        attribute.clearUpdateRanges();
      }

      if (typeof attribute.addUpdateRange === 'function') {
        attribute.addUpdateRange(0, count);
      } else if (attribute.updateRange) {
        attribute.updateRange.offset = 0;
        attribute.updateRange.count = count;
      }

      attribute.needsUpdate = true;
    };

    markAttributeDirty(positionAttribute, activeCount * positionAttribute.itemSize);
    markAttributeDirty(colorAttribute, activeCount * colorAttribute.itemSize);
    markAttributeDirty(opacityAttribute, activeCount);
    markAttributeDirty(sizeAttribute, activeCount);
    markAttributeDirty(angleAttribute, activeCount);
    markAttributeDirty(shapeIndexAttribute, activeCount);

    // Draw only compacted active slots.
    this.geometry.setDrawRange(0, activeCount);
  }

  _removeActiveParticleAt(activeIndex, positions = null, colors = null, opacities = null, sizes = null, angles = null, shapes = null) {
    const activeParticles = this._activeParticleIndices;
    const lastIndex = activeParticles.length - 1;
    if (activeIndex < 0 || activeIndex > lastIndex) return -1;

    const removedPoolIndex = activeParticles[activeIndex];
    const swappedPoolIndex = activeParticles[lastIndex];

    if (activeIndex !== lastIndex) {
      if (positions && colors && opacities && sizes && angles && shapes) {
        const fromSlot = lastIndex;
        const toSlot = activeIndex;

        positions[toSlot * 3] = positions[fromSlot * 3];
        positions[toSlot * 3 + 1] = positions[fromSlot * 3 + 1];
        positions[toSlot * 3 + 2] = positions[fromSlot * 3 + 2];

        colors[toSlot * 3] = colors[fromSlot * 3];
        colors[toSlot * 3 + 1] = colors[fromSlot * 3 + 1];
        colors[toSlot * 3 + 2] = colors[fromSlot * 3 + 2];

        opacities[toSlot] = opacities[fromSlot];
        sizes[toSlot] = sizes[fromSlot];
        angles[toSlot] = angles[fromSlot];
        shapes[toSlot] = shapes[fromSlot];
      }

      activeParticles[activeIndex] = swappedPoolIndex;
      const swappedParticle = this.pool[swappedPoolIndex];
      if (swappedParticle) {
        swappedParticle.activeListIndex = activeIndex;
      }
    }

    activeParticles.pop();
    return removedPoolIndex;
  }

  _releaseParticle(p, activeIndex, positions, colors, opacities, sizes = null, angles = null, shapes = null) {
    if (!p || !p.active) return;

    const poolIndex = p.index;
    const removedIndex = this._removeActiveParticleAt(activeIndex ?? p.activeListIndex, positions, colors, opacities, sizes, angles, shapes);

    p.active = false;
    p.activeListIndex = -1;
    p.linkRef = null;
    p.lifetime = p.maxLifetime;

    if (removedIndex >= 0) {
      this._freeParticleIndices.push(removedIndex);
    } else if (poolIndex >= 0) {
      this._freeParticleIndices.push(poolIndex);
    }
  }
  
  /**
   * Cleanup
   */
  dispose() {
    if (Array.isArray(this._semanticUnsubscribers)) {
      for (const unsub of this._semanticUnsubscribers) {
        try {
          unsub?.();
        } catch (_) {
          // noop
        }
      }
      this._semanticUnsubscribers.length = 0;
    }
    const unsubscribers = Array.isArray(this._linkLifecycleUnsubscribers)
      ? this._linkLifecycleUnsubscribers
      : [];
    for (const unsub of unsubscribers) {
      try {
        unsub?.();
      } catch (_) {
        // noop
      }
    }
    if (Array.isArray(this._linkLifecycleUnsubscribers)) {
      this._linkLifecycleUnsubscribers.length = 0;
    }
    this._unbindTopologyBiasAccentSubscriptions();
    if (this._topologyBiasAccentCooldowns instanceof Map) {
      this._topologyBiasAccentCooldowns.clear();
    }
    if (Array.isArray(this._pendingLinkEvents)) {
      this._pendingLinkEvents.length = 0;
    }
    if (this._linkSpawnState instanceof Map) {
      this._linkSpawnState.clear();
    }
    if (Array.isArray(this._freeParticleIndices)) {
      this._freeParticleIndices.length = 0;
    }
    if (Array.isArray(this._activeParticleIndices)) {
      this._activeParticleIndices.length = 0;
    }
    this._cascadeHopState.clear();
    this._semanticLinkState.clear();
    this._semanticStats.activeBoosts = 0;
    this._semanticStats.activeColorTints = 0;
    this._semanticStats.activeLinkCount = 0;
    this._semanticStats.avgIntensity = 0;
    this._semanticStats.avgUrgency = 0;
    this._semanticStats.conflictTypeDistribution = {};
    this._semanticStats.totalEmissionMultiplier = 0;
    this._semanticStats.peakEmissionMultiplier = 1;
    this._semanticRefreshRequested = false;
    this._disposeTrailLayer();
    
    // Clear cascade hop cooldowns
    this._linkHopCooldowns.clear();

    this.pointFXBase?.disposePointCloud?.(this.mesh);
    this.textureAtlas.dispose();
  }

  _disposeTrailLayer() {
    if (this.trailMesh && this.scene) {
      this.scene.remove(this.trailMesh);
    }
    if (this.trailGeometry) {
      this.trailGeometry.dispose();
    }
    if (this.trailMaterial) {
      this.trailMaterial.dispose();
    }

    this.trailMesh = null;
    this.trailGeometry = null;
    this.trailMaterial = null;
    this.trailPool.length = 0;
    this._trailPositionHistory.clear();
    this.activeTrailCount = 0;
  }
}

/**
 * Setup Adapter
 */
export function setupCascadeParticleSystem(game, options = {}) {
  try {
    const system = new CascadeParticleSystem_Session120(game.scene, {
      ...options,
      waveEngine: options.waveEngine ?? game.waveInterferenceEngine,
      semanticBus: options.semanticBus ?? game.semanticBus ?? globalThis?.semanticBus ?? null
    });
    game.cascadeParticleSystem = system;
    return system;
  } catch (err) {
    return null;
  }
}
