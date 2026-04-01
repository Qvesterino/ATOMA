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

export class CascadeParticleSystem_Session120 {
  constructor(scene, config = {}) {
    this.scene = scene;
    
    this.config = {
      maxParticles: config.maxParticles ?? 3000,
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
      }
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
    this._currentCamera = null;
    
    // Cascade hop cooldown tracking (per link)
    this._linkHopCooldowns = new Map(); // linkId -> lastHopTime
    this._debugHelpers = null;
    this._debugMarkerPool = [];
    this._debugMarkerCount = config.debugMarkerCount ?? 24;
    this._debugSourceMarkers = [];
    this._debugTargetMarkers = [];
    this._debugParticleMarkers = [];

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
      depthTest: false,
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
    this._initDebugHelpers();
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
   * Update Loop
   */
  update(deltaTime, activeLinks, camera = null) {
    const resolvedLinks = this._resolveActiveLinks(activeLinks);
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

    // Update existing active particles.
    this._updateParticles(cascadeDelta, currentCascadeTime, this._currentCamera);

    // Fallback spawn for links that have not yet emitted through lifecycle callbacks.
    this._spawnParticles(cascadeDelta, resolvedLinks, currentCascadeTime);

    this.activeCount = this._activeParticleIndices.length;

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
    // TEMPORARILY DISABLED: intensity gating to debug spawn issues
    // if (clampedIntensity < this.config.minimumVisibleIntensity) return;

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
      if (!linkState.isRelevant) continue;
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
    // TEMPORARILY DISABLED: isRelevant gating to debug spawn issues
    // if (!linkState?.isRelevant) return;

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
   * Respects density clustering parameters from Session 121
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
    
    // Session 121: Density & Clustering
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

    positionAttribute.updateRange.offset = 0;
    positionAttribute.updateRange.count = activeCount * positionAttribute.itemSize;
    colorAttribute.updateRange.offset = 0;
    colorAttribute.updateRange.count = activeCount * colorAttribute.itemSize;
    opacityAttribute.updateRange.offset = 0;
    opacityAttribute.updateRange.count = activeCount;
    sizeAttribute.updateRange.offset = 0;
    sizeAttribute.updateRange.count = activeCount;
    angleAttribute.updateRange.offset = 0;
    angleAttribute.updateRange.count = activeCount;
    shapeIndexAttribute.updateRange.offset = 0;
    shapeIndexAttribute.updateRange.count = activeCount;

    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    opacityAttribute.needsUpdate = true;
    sizeAttribute.needsUpdate = true;
    angleAttribute.needsUpdate = true;
    shapeIndexAttribute.needsUpdate = true;

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
    
    // Clear cascade hop cooldowns
    this._linkHopCooldowns.clear();

    this.pointFXBase?.disposePointCloud?.(this.mesh);
    this.textureAtlas.dispose();
  }
}

/**
 * Setup Adapter
 */
export function setupCascadeParticleSystem(game, options = {}) {
  try {
    const system = new CascadeParticleSystem_Session120(game.scene, {
      ...options,
      waveEngine: options.waveEngine ?? game.waveInterferenceEngine
    });
    game.cascadeParticleSystem = system;
    return system;
  } catch (err) {
    return null;
  }
}
